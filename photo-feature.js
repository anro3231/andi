/* Shared private photo uploads and daily photo. No gallery fetch on normal navigation. */
(()=>{
'use strict';
const BUCKET='fantastix-photos',API='fantastix_photo_api';
let config=null,account=null,generation=0,daily=null,dailyAt=0,inflight=null,dialog=null,previewURL=null,selected=null,uploadBusy=false,rows=[],hasMore=false,listBusy=false;
let shuffledPhoto=null,photoPool=null,seenPhotos=new Set(),shuffleBusy=false,shuffleError='',shuffleRun=0;
function resetShuffle(){shuffledPhoto=null;photoPool=null;seenPhotos.clear();shuffleBusy=false;shuffleError='';shuffleRun++;}
const currentPhoto=()=>shuffledPhoto||daily?.photo;

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;};
const context=()=>config?.context?.()||{};
function identity(){const c=context();if(c.user?.id!==account){account=c.user?.id||null;generation++;resetShuffle();daily=null;dailyAt=0;inflight=null;if(dialog?.open)dialog.close();rows=[];}return c;}
async function rpc(action,args={},c=identity()){if(!c.client||!c.user)throw Error('Bitte zuerst anmelden.');const result=await c.client.rpc(API,{p_action:action,p_args:args});if(result.error)throw result.error;return result.data;}
const uploadButton='<button class="ghost daily-photo-upload" type="button" data-photo-upload><span aria-hidden="true">＋</span> Bild hochladen</button>';
const photoActions=(withShuffle=false)=>`<div class="daily-photo-actions">${withShuffle?`<button class="ghost daily-photo-shuffle" type="button" data-photo-shuffle aria-disabled="${shuffleBusy}"><span aria-hidden="true">🔀</span> Shuffle</button>`:''}${uploadButton}</div>`;
const unavailable=(message)=>`<p class="muted">${message}</p><button class="smallbtn" type="button" data-photo-refresh>Erneut laden</button>${photoActions()}`;
function card(){return `<section class="card daily-photo-card" aria-labelledby="daily-photo-heading"><h2 id="daily-photo-heading">Unser Bild des Tages</h2><div data-daily-photo><p class="muted">Bild wird geladen …</p></div></section>`;}
function paint(){for(const el of document.querySelectorAll('[data-daily-photo]')){
 if(!account){el.innerHTML='<p class="muted">Bitte anmelden, um Bilder zu sehen und hochzuladen.</p>';continue;}
 if(!daily){el.innerHTML='<p class="muted">Bild wird geladen …</p>';continue;}
 const active=document.activeElement;
 const focus=el.contains(active)?['[data-photo-shuffle]','[data-photo-upload]'].find(s=>active.matches(s)):null;
 const p=currentPhoto();
 el.innerHTML=p?`<figure class="daily-photo-figure"><div class="daily-photo-surface"><img src="${escape(p.thumbURL)}" alt="Stammtisch-Bild" decoding="async" width="960" height="640">${shuffleBusy||shuffleError?`<p class="photo-browse-status" role="status">${escape(shuffleBusy?'Bild wird geladen …':shuffleError)}</p>`:''}</div><figcaption class="daily-photo-by">Von ${escape(p.uploader||'einem Mitglied')}</figcaption></figure>${photoActions(true)}`:`<div class="daily-photo-empty"><span aria-hidden="true">📷</span><p>Noch keine Bilder vorhanden.<br>Teile die erste Erinnerung vom Stammtisch!</p></div>${photoActions()}`;
 if(focus)el.querySelector(focus)?.focus({preventScroll:true});
 const img=el.querySelector('img');if(img)img.addEventListener('error',()=>{el.innerHTML=unavailable('Das Bild ist gerade nicht verfügbar.');},{once:true});
}}
async function signed(path,c){const r=await c.client.storage.from(BUCKET).createSignedUrl(path,3600);if(r.error)throw r.error;return r.data.signedUrl;}
async function load(force=false){const c=identity();if(!c.user||!c.client){paint();return;}if(!force&&daily?.day===day()&&Date.now()-dailyAt<5*60000){paint();return;}if(inflight)return inflight;
 const token=generation;const promise=(async()=>{try{const result=await rpc('daily',{},c);if(result.photo)result.photo.thumbURL=await signed(result.photo.thumb_path,c);if(token!==generation||context().user?.id!==c.user.id)return;if(force||daily?.day!==result.day||daily?.photo?.id!==result.photo?.id)resetShuffle();else if(daily.photo_count!==result.photo_count)photoPool=null;daily=result;dailyAt=Date.now();paint();}catch(e){if(token!==generation)return;for(const el of document.querySelectorAll('[data-daily-photo]'))el.innerHTML=unavailable('Das Tagesbild konnte nicht geladen werden.');console.warn('Tagesbild:',e.message);}finally{if(inflight===promise)inflight=null;}})();inflight=promise;return promise;}
function hydrate(){identity();if(document.querySelector('[data-daily-photo]')){paint();void load();}}
function getDialog(){if(!dialog){dialog=document.createElement('dialog');dialog.className='photo-dialog';dialog.setAttribute('aria-label','Stammtisch-Bilder');document.body.appendChild(dialog);dialog.addEventListener('cancel',e=>{if(uploadBusy)e.preventDefault();});dialog.addEventListener('close',()=>{if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}selected=null;});}return dialog;}
function show(html){const d=getDialog();d.innerHTML=html;if(!d.open)d.showModal();return d;}
const closeButton='<button class="photo-close" type="button" data-photo-close aria-label="Schließen">×</button>';
function upload(){const c=identity();if(!c.user)return alert('Bitte zuerst anmelden.');selected=null;show(`<div class="photo-dialog-head"><h2>Bild hochladen</h2>${closeButton}</div><form data-photo-form><div class="photo-picker"><span aria-hidden="true">📷</span><strong>Ein Bild vom Stammtisch teilen</strong><label class="button photo-file-label">Foto auswählen<input type="file" accept="image/*" data-photo-file></label><small>Aus deiner Fotomediathek oder Kamera</small></div><div data-photo-preview></div><p class="hint">Dein Bild kann als Bild des Tages erscheinen.</p><button class="button photo-submit" type="submit" disabled>Bild hochladen</button><p class="photo-status hint" role="status" aria-live="polite">Bitte ein Foto auswählen.</p></form>`);}
function status(text){const e=dialog?.querySelector('.photo-status');if(e)e.textContent=text;}
async function decode(file){const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Dieses Bildformat wird nicht unterstützt. Bitte JPEG, PNG oder WebP auswählen.'));img.src=url;});return img;}finally{URL.revokeObjectURL(url);}}
async function encode(img,maxSide,maxBytes){const ratio=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));let width=Math.max(1,Math.round(img.naturalWidth*ratio)),height=Math.max(1,Math.round(img.naturalHeight*ratio));
 for(let round=0;round<4;round++){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Bilder können auf diesem Gerät nicht verarbeitet werden.');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
 for(const quality of [.68,.58,.48]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=maxBytes){canvas.width=canvas.height=0;return blob;}}canvas.width=canvas.height=0;width=Math.max(1,Math.round(width*.75));height=Math.max(1,Math.round(height*.75));}
 throw Error('Das Bild konnte nicht ausreichend verkleinert werden. Bitte ein anderes Foto wählen.');}
async function prepare(file){const form=dialog?.querySelector('[data-photo-form]');if(!form)return;const submit=form.querySelector('[type="submit"]');submit.disabled=true;selected=null;if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}form.querySelector('[data-photo-preview]').innerHTML='';
 if(!file)return status('Bitte ein Foto auswählen.');if(!file.type.startsWith('image/')||file.size>30*1024*1024)return status('Bitte eine Bilddatei mit maximal 30 MB auswählen.');status('Bild wird für den Upload verkleinert …');form.dataset.preparing='true';const fileInput=form.querySelector('[data-photo-file]');fileInput.disabled=true;
 try{const img=await decode(file);const image=await encode(img,960,100000),thumb=image;if(!form.isConnected||!dialog.open)return;selected={image,thumb};previewURL=URL.createObjectURL(thumb);form.querySelector('[data-photo-preview]').innerHTML=`<img class="photo-upload-preview" src="${escape(previewURL)}" alt="Vorschau deines ausgewählten Bildes"><small>${escape(file.name)}</small>`;submit.disabled=false;status('Bereit zum Hochladen.');}catch(e){status(e.message);}finally{delete form.dataset.preparing;if(fileInput.isConnected)fileInput.disabled=false;}}
async function removePhoto(id,c=identity()){const record=await rpc('delete_begin',{id},c);const r=await c.client.storage.from(BUCKET).remove([...new Set([record.image_path,record.thumb_path])]);if(r.error)throw r.error;await rpc('delete_finish',{id},c);}
async function submit(form){if(uploadBusy||!selected)return;const c=identity(),token=generation,blobs=selected;uploadBusy=true;form.querySelectorAll('button,input').forEach(e=>e.disabled=true);let record=null;status('Bild wird hochgeladen …');
 try{record=await rpc('prepare',{caption:'',image_bytes:blobs.image.size,thumb_bytes:blobs.thumb.size},c);
 for(const [path,blob] of new Map([[record.image_path,blobs.image],[record.thumb_path,blobs.thumb]])){const r=await c.client.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});if(r.error)throw r.error;}
 await rpc('commit',{id:record.id},c);if(token!==generation)return;status('Bild hochgeladen! Danke für deine Erinnerung.');form.innerHTML='<div class="photo-success"><span aria-hidden="true">✓</span><h3>Bild hochgeladen!</h3><p>Dein Bild kann ab jetzt als Bild des Tages erscheinen.</p><button type="button" class="button" data-photo-close>Fertig</button></div>';dailyAt=0;await load(true);
 }catch(e){let cleanup='';if(record)try{await removePhoto(record.id,c);}catch{cleanup=' Ein unvollständiger Upload kann vom Admin unter Bilder verwalten entfernt werden.';}if(token===generation){status('Upload fehlgeschlagen: '+(e.message||String(e))+cleanup);form.querySelectorAll('button,input').forEach(x=>x.disabled=false);}}
 finally{uploadBusy=false;}}
async function shufflePhoto(){
 const c=identity(),current=currentPhoto();if(!c.user||!current||shuffleBusy)return;
 const run=shuffleRun;shuffleBusy=true;shuffleError='';paint();
 try{
  if(!photoPool){
   const pool=new Map();let cursor={};
   while(true){
    const {photos}=await rpc('browse',cursor,c);if(run!==shuffleRun||context().user?.id!==c.user.id)return;
    const page=photos.slice(0,20);for(const p of page)pool.set(p.id,p);
    if(photos.length<=20)break;
    const last=page.at(-1);cursor={before:last.created_at,before_id:last.id};
   }
   photoPool=[...pool.values()];
  }
  const alternatives=photoPool.filter(p=>p.id!==current.id);
  if(!alternatives.length){photoPool=null;shuffleError='Noch kein weiteres Bild vorhanden.';return;}
  seenPhotos.add(current.id);let choices=alternatives.filter(p=>!seenPhotos.has(p.id));
  if(!choices.length){seenPhotos=new Set([current.id]);choices=alternatives;}
  const next=choices[Math.floor(Math.random()*choices.length)];
  const thumbURL=await signed(next.thumb_path,c);
  if(run!==shuffleRun||context().user?.id!==c.user.id)return;
  shuffledPhoto={...next,thumbURL};
 }catch(e){if(run===shuffleRun){photoPool=null;shuffleError='Bild konnte nicht geladen werden. Bitte erneut versuchen.';}}
 finally{if(run===shuffleRun){shuffleBusy=false;paint();}}
}
async function manage(more=false){const c=identity();if(!c.admin)return;if(listBusy)return;listBusy=true;const token=generation;
 if(!more){rows=[];show(`<div class="photo-dialog-head"><h2>Bilder verwalten</h2>${closeButton}</div><div data-photo-gallery></div><p class="photo-status hint" role="status">Bilder werden geladen …</p>`);}
 try{const last=rows.at(-1);const r=await rpc('list',more&&last?{before:last.created_at,before_id:last.id}:{},c);hasMore=r.photos.length>20;const next=r.photos.slice(0,20);const ready=next.filter(p=>p.state==='ready');if(ready.length){const urls=await c.client.storage.from(BUCKET).createSignedUrls(ready.map(p=>p.thumb_path),3600);if(urls.error)throw urls.error;ready.forEach((p,i)=>p.thumbURL=urls.data[i]?.signedUrl);}
 if(token!==generation||!dialog?.open)return;rows.push(...next);paintGallery();status('');
 }catch(e){status('Bilder konnten nicht geladen werden: '+e.message);}finally{listBusy=false;}}
function paintGallery(){const el=dialog?.querySelector('[data-photo-gallery]');if(!el)return;el.innerHTML=`<div class="photo-gallery">${rows.map(p=>`<article>${p.thumbURL?`<img src="${escape(p.thumbURL)}" alt="Stammtisch-Bild" loading="lazy" decoding="async" width="360" height="240">`:'<div class="photo-pending">'+(p.state==='pending'?'Unvollständiger Upload':'Löschen fortsetzen')+'</div>'}<small>Von ${escape(p.uploader)} · ${escape(new Date(p.created_at).toLocaleDateString('de-AT'))}</small><button class="danger-btn" type="button" data-photo-delete="${escape(p.id)}">${p.state==='deleting'?'Löschen fortsetzen':'Bild löschen'}</button></article>`).join('')}</div>${!rows.length?'<p class="muted">Noch keine Bilder vorhanden.</p>':''}${hasMore?'<button class="ghost photo-more" type="button" data-photo-more>Mehr laden</button>':''}`;}
function reset(){account=null;generation++;resetShuffle();daily=null;dailyAt=0;inflight=null;rows=[];if(dialog?.open)dialog.close();}
window.FantastiXPhotos={configure:c=>{config=c;},card,hydrate,reset};
document.addEventListener('click',async e=>{const b=e.target.closest('[data-photo-upload],[data-photo-manage],[data-photo-close],[data-photo-more],[data-photo-delete],[data-photo-refresh],[data-photo-shuffle]');if(!b)return;e.preventDefault();
 if(b.hasAttribute('data-photo-close')){if(!uploadBusy)dialog?.close();}
 else if(b.hasAttribute('data-photo-shuffle'))void shufflePhoto();
 else if(b.hasAttribute('data-photo-upload'))upload();else if(b.hasAttribute('data-photo-manage'))void manage();else if(b.hasAttribute('data-photo-more'))void manage(true);else if(b.hasAttribute('data-photo-refresh'))void load(true);
 else if(b.hasAttribute('data-photo-delete')){if(!confirm('Dieses Bild dauerhaft löschen? Die Bilddateien werden ebenfalls entfernt.'))return;b.disabled=true;status('Bild wird gelöscht …');try{await removePhoto(b.dataset.photoDelete);rows=rows.filter(p=>p.id!==b.dataset.photoDelete);paintGallery();status('Bild gelöscht.');dailyAt=0;void load(true);}catch(error){status('Löschen fehlgeschlagen. Bitte erneut versuchen: '+error.message);b.disabled=false;}}
});
document.addEventListener('change',e=>{if(e.target.matches('[data-photo-file]'))void prepare(e.target.files?.[0]);});
document.addEventListener('submit',e=>{if(e.target.matches('[data-photo-form]')){e.preventDefault();void submit(e.target);}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)hydrate();});
setInterval(()=>{if(!document.hidden&&daily&&daily.day!==day())hydrate();},30000);
})();
