import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostedServer} from '../tools/start-render.mjs';
import {readRpc} from '../backend/rpc.mjs';

test('Render HTTPS forwarding preserves API origins, request bodies and per-visitor limits',async()=>{
  let seen;
  const worker={async fetch(request,env){
    seen={url:request.url,ip:request.headers.get('cf-connecting-ip'),text:await request.clone().text(),secret:env.MEADOW_REWARD_SIGNER_KEY};
    return readRpc(request,{game:'0x1',tom:'0x2'},'https://example.invalid',
      async()=>Response.json({jsonrpc:'2.0',id:1,result:'0xaa36a7'}));
  }};
  const server=createHostedServer(worker,{MEADOW_REWARD_SIGNER_KEY:'test-only'},{externalUrl:'https://farm.onrender.com',trustProxy:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  try{
    const body=JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]});
    let response=await fetch(url+'/api/rpc',{method:'POST',headers:{Origin:'https://farm.onrender.com','X-Forwarded-For':'198.51.100.4, 10.0.0.1','cf-connecting-ip':'forged'},body});
    assert.equal(response.status,200);assert.equal((await response.json()).result,'0xaa36a7');
    assert.deepEqual(seen,{url:'https://farm.onrender.com/api/rpc',ip:'198.51.100.4',text:body,secret:'test-only'});
    response=await fetch(url+'/api/rpc',{method:'POST',headers:{Origin:'https://other.example'},body});
    assert.equal(response.status,403);
    response=await fetch(url+'/api/rpc',{method:'POST',body:'x'.repeat(1_000_001)});
    assert.equal(response.status,413);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
