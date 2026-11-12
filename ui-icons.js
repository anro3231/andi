/* Lokale Symbole, auf Basis der bestehenden FantastiX-Navigation. */
(function(){
function icon(k){const paths={chevronRight:'<path d="m9 5 7 7-7 7"/>',thumbsUp:'<path d="M7 10v11H3V10h4Zm0 0 5-7a3 3 0 0 1 2 3l-1 4h6a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H7"/>',thumbsDown:'<path d="M7 14V3H3v11h4Zm0 0 5 7a3 3 0 0 0 2-3l-1-4h6a2 2 0 0 0 2-2l-1-7a2 2 0 0 0-2-2H7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',location:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',check:'<path d="m5 12 4 4L19 6"/>',question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',crown:'<path d="m3 5 5 6 4-8 4 8 5-6-2 14H5L3 5ZM5 22h14"/>',flame:'<path d="M12 3c0 5-6 7-6 12a6 6 0 0 0 12 0c0-3-2-5-3-6 0 3-2 4-3 4 2-4 1-7 0-10Z"/>',home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',meetings:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15l2 2 5-5"/>',members:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',ranking:'<path d="M8 21h8M12 17v4M7 4h10v7a5 5 0 0 1-10 0V4ZM7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/>',fines:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2M7 3v2"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.3 2.3-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.3-2.3.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4v-3.2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.3-2.3.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h3.2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.3 2.3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v3.2h-.2a1.7 1.7 0 0 0-1.6 1z"/>',excursions:'<path d="M3 17h18l-4-9-5 5-3-4-6 8z"/><path d="M4 21h16M7 4v4M5 6h4"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h2M12 15h2M8 19h2"/>',cloud:'<path d="M20 16.6a4 4 0 0 0-2-7.5A6 6 0 0 0 6.4 10 4 4 0 0 0 7 18h11"/><path d="m10 15 2 2 4-4"/>'};return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[k]||paths.home}</svg>`;}
function voteIcon(status){const name={present:'thumbsUp',yes:'thumbsUp',absent:'thumbsDown',no:'thumbsDown',unsure:'question'}[status];return name?icon(name):'';}
// Keep the dialog shell stable during reads; only opening/closing animates.
const boundInboxes=new WeakSet(),inboxCloseTimers=new WeakMap();
function closeInbox(dialog){
 if(!dialog?.open||dialog.classList.contains('is-closing'))return;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}
 dialog.classList.add('is-closing');
 inboxCloseTimers.set(dialog,window.setTimeout(()=>{if(dialog.classList.contains('is-closing'))dialog.close();},160));
}
function renderInbox(dialog,html,{open=false,opener}={}){
 if(!dialog||!open&&(!dialog.open||!dialog.classList.contains('fx-inbox-dialog')||dialog.classList.contains('is-closing')))return;
 const scroll=dialog.querySelector('.fx-inbox-list')?.scrollTop||0;
 const focused=dialog.contains(document.activeElement)?document.activeElement:null;
 const focusKey=focused?.hasAttribute('data-inbox-close')?{close:true}:focused?.id?{id:focused.id}:focused?.dataset.readerRead?{readerRead:focused.dataset.readerRead}:focused?.dataset.action?{action:focused.dataset.action,idValue:focused.dataset.id}:null;
 window.clearTimeout(inboxCloseTimers.get(dialog));inboxCloseTimers.delete(dialog);
 dialog.classList.remove('is-closing');dialog.classList.add('fx-inbox-dialog');
 dialog.setAttribute('aria-label','Benachrichtigungen');dialog.dataset.inboxOpener=opener||dialog.dataset.inboxOpener||'';
 dialog.innerHTML=html;
 if(!boundInboxes.has(dialog)){
  boundInboxes.add(dialog);
  dialog.addEventListener('click',e=>{if(dialog.classList.contains('fx-inbox-dialog')&&(e.target===dialog||e.target.closest('[data-inbox-close]')))closeInbox(dialog);});
  dialog.addEventListener('cancel',e=>{if(dialog.classList.contains('fx-inbox-dialog')){e.preventDefault();closeInbox(dialog);}});
  dialog.addEventListener('close',()=>{
   if(!dialog.classList.contains('fx-inbox-dialog'))return;
   window.clearTimeout(inboxCloseTimers.get(dialog));inboxCloseTimers.delete(dialog);
   dialog.classList.remove('fx-inbox-dialog','is-closing');
   const trigger=document.querySelector(dialog.dataset.inboxOpener);trigger?.setAttribute('aria-expanded','false');trigger?.focus({preventScroll:true});
  });
 }
 if(!dialog.open)dialog.showModal();
 else if(focusKey){
  const target=[...dialog.querySelectorAll('button')].find(b=>!b.disabled&&(focusKey.close?b.hasAttribute('data-inbox-close'):focusKey.readerRead?b.dataset.readerRead===focusKey.readerRead:focusKey.action?b.dataset.action===focusKey.action&&b.dataset.id===focusKey.idValue:b.id===focusKey.id));
  (target||dialog.querySelector('[data-inbox-close]'))?.focus({preventScroll:true});
 }
 const list=dialog.querySelector('.fx-inbox-list');if(list)list.scrollTop=scroll;
 document.querySelector(dialog.dataset.inboxOpener)?.setAttribute('aria-expanded','true');
}
window.FantastixUI={icon,voteIcon,renderInbox,closeInbox};
function openProfilePhoto(photo){
 let viewer=document.querySelector('#profile-photo-viewer');
 if(!viewer){
  viewer=document.createElement('dialog');viewer.id='profile-photo-viewer';viewer.className='profile-photo-viewer';viewer.setAttribute('aria-label','Profilbild');
  const close=document.createElement('button');close.type='button';close.className='photo-viewer-close';close.textContent='×';close.setAttribute('aria-label','Profilbild schließen');close.addEventListener('click',()=>viewer.close());
  const image=document.createElement('img');image.className='profile-photo-large';
  viewer.append(close,image);document.body.appendChild(viewer);
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  viewer.addEventListener('close',()=>{image.removeAttribute('src');if(photoReturnFocus?.isConnected)photoReturnFocus.focus();photoReturnFocus=null;});
 }
 photoReturnFocus=photo;const image=viewer.querySelector('img');image.src=photo.currentSrc||photo.src;image.alt=photo.alt||'Profilbild';
 if(!viewer.open)viewer.showModal();
}
let photoReturnFocus=null;
document.addEventListener('click',e=>{const photo=e.target.closest('[data-profile-photo]');if(photo){e.preventDefault();e.stopImmediatePropagation();openProfilePhoto(photo);}},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-profile-photo]')){e.preventDefault();e.stopImmediatePropagation();openProfilePhoto(e.target);}},true);
})();
