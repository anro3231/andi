const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const events={},surface={innerHTML:'',contains:()=>false,querySelector:()=>null};
 const photos=Array.from({length:23},(_,i)=>({id:String(i),thumb_path:'p'+i+'.jpg',uploader:'Anna',created_at:new Date(Date.UTC(2026,0,i+1)).toISOString()}));
 let available=photos,browseCalls=0,dailyCalls=0,signCalls=0,account={id:'a'};
 const client={rpc:async(_,{p_action,p_args})=>{
  if(p_action==='daily'){dailyCalls++;return {data:{day:'2026-11-05',photo:{...photos[0]},photo_count:available.length}};}
  assert.equal(p_action,'browse');browseCalls++;const from=p_args.before_id?Number(p_args.before_id)+1:0;return {data:{photos:available.slice(from,from+21)}};
 },storage:{from:()=>({createSignedUrl:async path=>{signCalls++;return {data:{signedUrl:'https://example.test/'+path}};}})}};
 const ctx=vm.createContext({window:{},document:{activeElement:null,querySelector:()=>surface,querySelectorAll:()=>[surface],addEventListener:(n,f)=>events[n]=f},setInterval(){},console,Math:Object.assign(Object.create(Math),{random:()=>.999})});
 vm.runInContext(fs.readFileSync(__dirname+'/photo-feature.js','utf8'),ctx);
 const api=ctx.window.FantastiXPhotos;api.configure({context:()=>({client,user:account})});
 const settle=()=>new Promise(resolve=>setImmediate(resolve));
 const target={closest:()=>target,hasAttribute:n=>n==='data-photo-shuffle'};
 const click=async()=>{await events.click({target,preventDefault(){}});await settle();};
 const current=()=>surface.innerHTML.match(/src="https:\/\/example.test\/(p\d+\.jpg)"/)?.[1];
 api.hydrate();await settle();assert.equal(current(),'p0.jpg');assert.equal(browseCalls,0);assert.equal(signCalls,1);assert.match(surface.innerHTML,/data-photo-shuffle/);assert.doesNotMatch(surface.innerHTML,/photo-dots|data-photo-swipe/);
 await click();assert.equal(current(),'p22.jpg','Shuffle includes photos beyond the first page');assert.equal(browseCalls,2);assert.equal(signCalls,2);
 const seen=new Set(['p0.jpg',current()]);for(let i=0;i<21;i++){await click();assert.ok(!seen.has(current()));seen.add(current());}assert.equal(seen.size,23);
 const previous=current();await click();assert.notEqual(current(),previous);assert.equal(browseCalls,2);assert.equal(dailyCalls,1,'Shuffle does not change the shared daily selection');
 account={id:'b'};available=[photos[0]];api.hydrate();await settle();await click();assert.equal(current(),'p0.jpg');assert.match(surface.innerHTML,/kein weiteres Bild/);
 console.log('PASS photo shuffle: on-demand pagination, no repeats until all seen, daily selection unchanged, account isolation, single photo.');
})().catch(e=>{console.error(e);process.exitCode=1;});
