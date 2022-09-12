import { init, parse } from 'es-module-lexer'
import { BARE_IMPORT_RE, DEFAULT_EXTENSIONS, PRE_BUNDLE_DIR } from '../constants'
import { cleanUrl, isJSRequest, getShortName, isInternalRequest } from '../utils'
import MagicString from 'magic-string'
import path from 'path'
import { Plugin } from '../plugin'
import { ServerContext } from '../server'
import { pathExists } from 'fs-extra'
import resolve from 'resolve'
import { ModuleNode } from '../moduleGraph'

/**
 * 對 import 重寫路徑
 * 
 */
export function importAnalysisPlugin() {
    let serverContext: ServerContext
    return {
        name: 'm-vite:import-analysis',
        configureServer(s: ServerContext) {
            serverContext = s
        },
        async transform(code: string, id: string) {
            if (!isJSRequest(id)) {
                return null
            }
            await init
            const [imports] = parse(code)
            const ms = new MagicString(code)

            const { moduleGraph } = serverContext
            const curMod = moduleGraph.getModuleId(id)
            const importedModules = new Set<string>()

            for (const importInfo of imports) {
                const { s: modStart, e: modEnd, n: modSource } = importInfo
                if (!modSource) continue
                if (modSource.endsWith('.svg')) {
                    const resolvedUrl = path.join(path.dirname(id), modSource)
                    ms.overwrite(modStart, modEnd, `${resolvedUrl}?import`)
                    continue
                }
                // 對第三方依賴路徑做處理
                if (BARE_IMPORT_RE.test(modSource)) {
                    const bundlePath = path.join(serverContext.root, PRE_BUNDLE_DIR, `${modSource}.js`)
                    ms.overwrite(modStart, modEnd, bundlePath)
                    importedModules.add(bundlePath)
                } else if (modSource.startsWith('.') || modSource.startsWith('/')) {
                    // 相對路徑或絕對路徑做處理
                    const resolved = await this.resolve(modSource, id)
                    if (resolved) {
                        ms.overwrite(modStart, modEnd, resolved.id)
                        importedModules.add(resolved.id)
                    }
                }
            }
            moduleGraph.updateModuleInfo(curMod as ModuleNode, importedModules)
            return {
                code: ms.toString(),
                map: ms.generateMap()
            }
        }
    }
}