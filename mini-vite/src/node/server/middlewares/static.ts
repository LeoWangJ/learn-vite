import { NextHandleFunction } from 'connect'
import {isImportRequest} from '../../utils'
import sirv from 'sirv'

export function staticMiddleware():NextHandleFunction {
  const serverFromRoot = sirv('/',{dev:true})
  return async (req,res,next) =>{
    if(!req.url){
      return 
    }

    if(isImportRequest(req.url)){
      return
    }
    serverFromRoot(req,res,next)
  }
}