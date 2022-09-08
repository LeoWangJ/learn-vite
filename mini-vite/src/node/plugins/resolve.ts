import resolve from "resolve"
import { Plugin } from "../plugin"
import { ServerContext } from "../server"
import path from 'path'
import { pathExists } from "fs-extra"
import { DEFAULT_EXTENSIONS } from '../constants'
import { cleanUrl } from "../utils"

/**
 * 解析資源路徑
 */
export function resolvePlugin(): Plugin {
    let serverContext: ServerContext
    return {
        name: 'm-vite:resolve',
        configureServer(s) {
            serverContext = s
        },
        async resolveId(id: string, importer?: string) {
            if (path.isAbsolute(id)) {
                if (await pathExists(id)) {
                    return { id }
                }

                // 加上 root 路徑前綴、處理 /src/main.tsx 情況
                id = path.join(serverContext.root, id)
                if (await pathExists(id)) {
                    return { id }
                }
            } else if (id.startsWith('.')) {
                if (!importer) {
                    throw new Error('`importer` should not be undefined')
                }
                const hasExtension = path.extname(id).length > 1
                let resolveId: string
                // 包含文件名後綴 ex ./App.tsx
                if (hasExtension) {
                    resolveId = resolve.sync(id, { basedir: path.dirname(importer) })
                    if (await pathExists(resolveId)) {
                        return { id: resolveId }
                    }
                } else {
                    // 不包含文件名後綴 ex : ./App
                    for (const extname of DEFAULT_EXTENSIONS) {
                        try {
                            const withExtension = `${id}${extname}`
                            resolveId = resolve.sync(withExtension, { basedir: path.dirname(importer) })
                            if (await pathExists(resolveId)) {
                                return { id: resolveId }
                            }
                        } catch (e) {
                            continue
                        }
                    }
                }

            }
            return null
        }
    }
}