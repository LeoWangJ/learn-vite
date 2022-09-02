module.exports = () =>({
  name:'esbuild:http',
  setup(build) {
    let https = require('https')
    let http = require('http')

    // 1. 攔截 CDN 請求
    build.onResolve({filter:/^https?:\/\//},(args)=>({
      path:args.path,
      namespace:'http-url'
    }))
    
    // 攔截間接依賴的路徑，並重寫路徑
    build.onResolve({ filter: /.*/, namespace: "http-url" }, (args) => ({
      path: new URL(args.path, args.importer).toString(),
      namespace: "http-url",
    }))

    // 2. 通過 fetch 請求加載 CDN 資源
    build.onLoad({filter:/.*/,namespace:'http-url'},async (args) =>{
      let contents = await new Promise((resolve,reject)=>{
        function fetch(url){
          console.log(`Downloading: ${url}`);
          let lib = url.startsWith("https") ? https:http
          let req = lib.get(url,(res)=>{
            if([301,302,307].includes(res.statusCode)){
              // 重定向
              fetch(new URL(res.headers.location,url).toString())
            }else if(res.statusCode === 200){
              let chunks = []
              res.on('data',(chunk)=>chunks.push(chunk))
              res.on('end',()=> resolve(Buffer.concat(chunks)))
            } else{
              reject(new Error(`GET ${url} failed: status ${res.statusCode}`))
            }
          }).on("error",reject)
        }

        fetch(args.path)
      })
      return {contents}
    })
  }
})