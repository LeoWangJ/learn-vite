import { Loader, Plugin } from "esbuild"
import { BARE_IMPORT_RE } from "../constants"
import createDebug from 'debug'
import resolve from "resolve"
import { ExportSpecifier, init, parse } from "es-module-lexer"
import fs from "fs-extra"
import path from "path"

const debug = createDebug("dev")

export function preBundlePlugin(deps:Set<string>):Plugin{
  return{
    name:'esbuild:pre-bundle',
    setup(build){
      build.onResolve(
        {filter: BARE_IMPORT_RE},
        (resolveInfo) =>{
          const { path:id, importer } = resolveInfo
          const isEntry = !importer
          if(deps.has(id)){
            return isEntry ? {
              path:id,
              namespace:"dep"
            } : {
              path: resolve.sync(id, {basedir: process.cwd()})
            }
          }
        }
      )

      build.onLoad(
        {filter: /.*/,namespace:'dep'},
        async (loadInfo) => {
          await init
          const id = loadInfo.path
          const root = process.cwd()
          const entryPath = resolve.sync(id,{basedir: root})
          const code = await fs.readFile(entryPath,'utf-8')
          const [imports,exports] = await parse(code)
          let proxyModule = []

          // cjs
          if(!imports.length && !exports.length){
            const res = require(entryPath)
            const specifiers = Object.keys(res)
            proxyModule.push(
              `export { ${specifiers.join(",")} } from "${entryPath}"`,
              `export default require("${entryPath}")`
            )
          }else{
            // esm
            if(exports.includes("default" as unknown as ExportSpecifier)){
              proxyModule.push(`import d from "${entryPath}";export default d`)
            }
            proxyModule.push(`export * from "${entryPath}"`)
          }
          debug("代理模塊內容: %o", proxyModule.join('\n'))
          const loader = path.extname(entryPath).slice(1)
          return {
            loader: loader as Loader,
            contents: proxyModule.join('\n'),
            resolveDir:root
          }
        }
      )
    }
  }
}