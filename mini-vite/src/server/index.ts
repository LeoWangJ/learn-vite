import connect from 'connect'
import {blue,green} from 'picocolors'

export async function startDevServer(){
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()
  app.listen(8484,async()=>{
    console.log(green('No Bundle Server Running!'),`cost ${Date.now() - startTime}ms time`)
    console.log(`> localhost: ${blue("http://localhost:8484")}`)
  })
}