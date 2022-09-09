import { HASH_RE, JS_TYPES_RE, QUERY_RE } from './constants'
import path from 'path'

export const isJSRequest = (id: string): boolean => {
    id = cleanUrl(id)
    if (JS_TYPES_RE.test(id)) {
        return true
    }
    if (!path.extname(id) && !id.endsWith("/")) {
        return true
    }
    return false
}

export const isCSSRequest = (id:string):boolean =>{
    return cleanUrl(id).endsWith('.css')
}

export const isImportRequest = (id:string):boolean =>{
    return  id.endsWith('?import')
}

export const removeImportQuery = (url:string):string =>{
    return url.replace(/\?import$/,"")
}
export const cleanUrl = (url: string): string => {
    return url.replace(HASH_RE, "").replace(QUERY_RE, "")
}