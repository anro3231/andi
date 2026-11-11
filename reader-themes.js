/* Reader-only appearance. Session storage, no account or database writes. */
(()=>{
'use strict';
const themes=[
 {id:'standard',name:'Standard',description:'Aktuelles Design',color:'#151515'},
 {id:'dark',name:'Dunkel',description:'Dunkel & ruhig',color:'#10151e'},
 {id:'blue',name:'Blau',description:'Klar & frisch',color:'#edf3fa'},
 {id:'green',name:'Grün',description:'Natürlich & sanft',color:'#eff5f1'}
],key='fantastix.reader.theme.session.v1',root=document.documentElement;
const meta=document.querySelector('meta[name="theme-color"]'),originalColor=meta?.content;
let selected='standard',dialog;
try{const saved=sessionStorage.getItem(key);if(themes.some(t=>t.id===saved))selected=saved;}catch{}
function apply(id){
 const theme=themes.find(t=>t.id===id);if(!theme)return;
 selected=id;
 if(id==='standard')root.removeAttribute('data-reader-theme');else root.dataset.readerTheme=id;
 if(meta)meta.content=id==='standard'?originalColor:theme.color;
}
apply(selected);
function open(){
 if(!dialog){
  dialog=document.createElement('dialog');dialog.className='reader-theme-dialog';dialog.setAttribute('aria-labelledby','reader-theme-heading');
  dialog.innerHTML=`<div class="reader-theme-heading"><h2 id="reader-theme-heading">Darstellung</h2><button type="button" class="reader-theme-close" aria-label="Farbauswahl schließen">×</button></div><p class="reader-theme-hint" id="reader-theme-help">Wähle dein Farbschema für diese Sitzung.</p><fieldset class="reader-theme-options" aria-describedby="reader-theme-help"><legend>Farbschema</legend>${themes.map(t=>`<label class="reader-theme-option theme-preview-${t.id}"><input type="radio" name="reader-theme" value="${t.id}"><span class="reader-theme-preview" aria-hidden="true"><span class="theme-preview-heading"></span><span class="theme-preview-card"></span><span class="theme-preview-accent"></span></span><span class="reader-theme-name">${t.name}<span class="reader-theme-check" aria-hidden="true">✓</span></span><small>${t.description}</small></label>`).join('')}</fieldset>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.reader-theme-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('change',e=>{
   if(!e.target.matches('input[name="reader-theme"]'))return;
   apply(e.target.value);try{sessionStorage.setItem(key,selected);}catch{}
  });
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{const button=document.querySelector('#reader-theme-open');button?.setAttribute('aria-expanded','false');button?.focus();});
 }
 for(const radio of dialog.querySelectorAll('input[name="reader-theme"]'))radio.checked=radio.value===selected;
 if(!dialog.open){dialog.showModal();dialog.querySelector('input:checked')?.focus();}
 document.querySelector('#reader-theme-open')?.setAttribute('aria-expanded','true');
}
document.addEventListener('click',e=>{if(e.target.closest('#reader-theme-open')){e.preventDefault();open();}});
})();
