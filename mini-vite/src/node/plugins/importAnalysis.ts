import { init, parse } from 'es-module-lexer'
import { BARE_IMPORT_RE, CLIENT_PUBLIC_PATH, DEFAULT_EXTENSIONS, PRE_BUNDLE_DIR } from '../constants'
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
            if (!isJSRequest(id) || isInternalRequest(id)) {
                return null
            }
            await init
            const [imports] = parse(code)
            const ms = new MagicString(code)
            const resolve = async (id: string, importer?: string) => {
                const resolved = await this.resolve(id, importer)
                if (!resolved) return
                const cleanedId = cleanUrl(resolved.id)
                const mod = moduleGraph.getModuleId(cleanedId)
                let resolveId = `/${getShortName(resolved.id, serverContext.root)}`
                if (mod && mod.lastHMRTimestamp > 0) {
                    resolveId += `?t=${mod.lastHMRTimestamp}`
                }
                return resolveId
            }

            const { moduleGraph } = serverContext
            const curMod = moduleGraph.getModuleId(id)!
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
                    const resolved = await resolve(modSource, id)
                    if (resolved) {
                        ms.overwrite(modStart, modEnd, resolved)
                        importedModules.add(resolved)
                    }
                }
            }

            // 只對業務代碼注入
            if (!id.includes("node_modules")) {
                // 注入 HMR 相關的函數, 該函數用來注入 import.meta.hot 物件
                ms.prepend(
                    `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
                    `import.meta.hot = __vite__createHotContext(${JSON.stringify(cleanUrl(curMod.url))});`
                )
            }

            moduleGraph.updateModuleInfo(curMod as ModuleNode, importedModules)
            return {
                code: ms.toString(),
                map: ms.generateMap()
            }
        }
    }
}