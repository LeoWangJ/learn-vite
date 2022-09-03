const {build} = require("esbuild")
const httpImport = require("./html-import-plugin")
const html = require("./html-generate-plugin")

async function runBuild(){
  build({
    absWorkingDir: process.cwd(),
    entryPoints: ["./src/index.jsx"],
    outdir: "dist",
    bundle: true,
    format: "esm",
    splitting: true,
    sourcemap: true,
    metafile: true,
    plugins: [
      httpImport(),
      html()
    ],
  }).then(()=> console.log('build finished!'))
}

runBuild()