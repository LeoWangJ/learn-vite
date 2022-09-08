import { readFile } from "fs-extra"
import { Plugin } from "../plugin"
import { isJSRequest } from "../utils"
import esbuild, { transform } from 'esbuild'
import path from 'path'

/**
 * load - 加載資源
 * transform - 轉換成瀏覽器看得懂的程式碼 
 */
export function esbuildTransformPlugin() {
  return {
    name: 'm-vite:esbuild-transform',
    async load(id:string){
      if(isJSRequest(id)){
        try{
          const code = await readFile(id,'utf-8')
          return code
        }catch(e){
          return null
        }
      }
      return null
    },
    async transform(code:string, id:string){
      if(isJSRequest(id)){
        const extname = path.extname(id).slice(1)
        const { code: transformedCode,map } = await esbuild.transform(code,{
          target:'esnext',
          format: 'esm',
          sourcemap: true,
          loader: extname as 'js' | 'ts' | 'jsx' | 'tsx'
        })

        return {
          code: transformedCode,
          map
        }
      }
      return null
    }
  }
}