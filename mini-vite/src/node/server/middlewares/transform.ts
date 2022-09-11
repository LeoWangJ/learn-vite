import { NextHandleFunction } from 'connect'
import { isJSRequest,isCSSRequest,  cleanUrl,isImportRequest } from '../../utils'
import { ServerContext } from '..'
import createDebug from 'debug'

const debug = createDebug("dev")

export async function transformRequest(url: string, serverContext: ServerContext) {
    const { moduleGraph,pluginContainer } = serverContext
    url = cleanUrl(url)
    let mod = await moduleGraph.getModuleByUrl(url)
    if(mod && mod.transformResult){
        return mod.transformResult
    }
    // 依次調用 resolved 、 load 、 transform
    const resolveResult = await pluginContainer.resolveId(url)
    let transformResult
    if (resolveResult?.id) {
        let code = await pluginContainer.load(resolveResult.id)
        if (typeof code === 'object' && code !== null) {
            code = code.code
        }
        const {moduleGraph} = serverContext
        mod = await moduleGraph.ensureEntryFromUrl(url)
        if (code) {
            transformResult = await pluginContainer.transform(code, resolveResult.id)
        }
    }
    if(mod?.transformResult){
        mod.transformResult = transformResult
    }
    return transformResult
}

export function transformMiddleware(serverContext: ServerContext): NextHandleFunction {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !req.url) {
            return next()
        }

        const url = req.url
        debug("transformMiddleware: %s", url)

        if (isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
            let result = await transformRequest(url, serverContext)
            let transformResult
            if (!result) {
                return next()
            }

            if (result && typeof result !== 'string') {
                transformResult = result.code
            }
            res.statusCode = 200
            res.setHeader('Content-Type', "application/javascript")
            return res.end(transformResult)
        }
        next()

    }
}
