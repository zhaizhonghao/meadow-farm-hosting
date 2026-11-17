import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const maxBodyBytes=1_000_000;

// Render terminates TLS before forwarding to Node. Use its public HTTPS origin
// when rebuilding the Request, so the existing same-origin API checks stay valid.
export function createHostedServer(worker,env,{externalUrl,trustProxy=false}={}) {
  const publicOrigin=externalUrl?new URL(externalUrl).origin:null;
  return http.createServer(async(req,res)=>{
    try {
      const length=Number(req.headers['content-length']||0);
      if(length>maxBodyBytes){
        res.writeHead(413,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error:'Trace too large. Start a fresh round.'}));return;
      }
      const chunks=[];let received=0;
      for await(const chunk of req){
        received+=chunk.length;
        if(received>maxBodyBytes){
          res.writeHead(413,{'Content-Type':'application/json'});
          res.end(JSON.stringify({error:'Trace too large. Start a fresh round.'}));return;
        }
        chunks.push(chunk);
      }
      const base=publicOrigin||'http://'+(req.headers.host||'localhost');
      const url=new URL(req.url||'/',base);
      const headers=new Headers();
      for(const [key,value] of Object.entries(req.headers)){
        if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
      }
      // The worker rate-limits per visitor. A production reverse proxy supplies
      // X-Forwarded-For; loopback tests use the peer address directly.
      const forwarded=trustProxy?req.headers['x-forwarded-for']?.split(',')[0].trim():null;
      headers.set('cf-connecting-ip',forwarded||req.socket.remoteAddress||'local');
      const request=new Request(url,{method:req.method,headers,
        ...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
      const result=await worker.fetch(request,env);
      res.writeHead(result.status,Object.fromEntries(result.headers));
      res.end(req.method==='HEAD'?undefined:Buffer.from(await result.arrayBuffer()));
    }catch{
      if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify({error:'The game server could not complete this request.'}));
    }
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const filename=path.resolve(process.argv[2]||'dist/server/index.js');
  const {default:worker}=await import(pathToFileURL(filename));
  const port=Number(process.env.PORT||10000);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be a valid listening port.');
  const env={MEADOW_REWARD_SIGNER_KEY:process.env.MEADOW_REWARD_SIGNER_KEY||'',
    ...(process.env.MEADOW_RPC_URL?{MEADOW_RPC_URL:process.env.MEADOW_RPC_URL}:{})};
  const server=createHostedServer(worker,env,{externalUrl:process.env.RENDER_EXTERNAL_URL,
    trustProxy:process.env.RENDER==='true'});
  server.listen(port,'0.0.0.0',()=>console.log('Meadow Farm listening on port '+port));
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
    server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),10000).unref();
  });
}
