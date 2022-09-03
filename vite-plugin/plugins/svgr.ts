import { Plugin } from "vite"
import * as fs from 'fs'
import * as resolve from 'resolve'

interface SvgrOptions {
  // svg 資源模塊默認導出，url 或者組件
  defaultExport: 'url' | 'component';
}
/**
 * 1. 根據 id 入參過濾出 svg 資源；
 * 2. 讀取 svg 文件內容；
 * 3. 利用 @svgr/core 將 svg 轉換為 React 組件代碼;
 * 4. 處理默認導出為 url 的情況；
 * 5. 將組件的 jsx 代碼轉譯為瀏覽器可運行的代碼。
 */
export default function viteSvgrPlugin(options?:SvgrOptions): Plugin{
  const { defaultExport = 'component'} = options || {}
  return {
    name: 'vite-plugin-svgr',
    async transform(code,id){
      if(!id.endsWith('.svg')){
        return code
      }
      const svgrTransform = require('@svgr/core').transform
      const esbuildPackagePath = resolve.sync('esbuild',{basedir:require.resolve('vite')})
      const esbuild = require(esbuildPackagePath)
      const svg = await fs.promises.readFile(id,'utf8')
      const svgrResult = await svgrTransform(
        svg,
        {},
        {componentName:'ReactComponent'}
      )
      let componentCode = svgrResult

      if(defaultExport === 'url'){
        componentCode += code;
        componentCode = svgrResult.replace('export default ReactComponent', 'export { ReactComponent }');
      }
      
      const result = await esbuild.transform(componentCode, {
        loader: 'jsx',
      });

      return result.code
    }
  }
}