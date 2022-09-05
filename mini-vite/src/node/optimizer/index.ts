import path from 'path'
import { build } from 'esbuild'
import { green } from 'picocolors'
import { scanPlugin } from './scanPlugin'
import { preBundlePlugin } from "./preBundlePlugin";
import { PRE_BUNDLE_DIR } from "../constants";
/**
 * 1. 確定入口 - 暫時寫死
 * 2. 從入口處掃描依賴
 * 3. 預構建依賴
 * 
 * @param root 
 */
export async function optimize(root:string){
  const entry = path.resolve(root,"src/main.tsx")

  const deps = new Set<string>()
  await build({
    entryPoints:[entry],
    bundle:true,
    write:false,
    plugins:[scanPlugin(deps)]
  })
  console.log(`${green('pre-bundle deps')}:\n${[...deps].map(green).map(item=>`    ${item}`).join('\n')}`)

  await build({
    entryPoints:[...deps],
    write:true,
    bundle:true,
    format:"esm",
    splitting:true,
    outdir:path.resolve(root,PRE_BUNDLE_DIR),
    plugins:[preBundlePlugin(deps)]
  })
}