// Device-local settings, synthetic DOM, no account or network access.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
const source=fs.readFileSync(__dirname+'/reader-themes.js','utf8'),key='fantastix.reader.theme.device.v1';
const html=fs.readFileSync(__dirname+'/lesen.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
function setup(saved,blocked=false,photoState){
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(saved)w.localStorage.setItem(key,saved);if(photoState)w.localStorage.setItem('fantastix.reader.daily-photo.device.v1',photoState);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
 w.eval(source);w.document.querySelector('#reader-app').hidden=false;w.document.querySelector('#content').innerHTML=w.FantastiXReaderSettings.card();return dom;
}
const dom=setup(),w=dom.window,d=w.document,root=d.documentElement;
assert.equal(root.hasAttribute('data-reader-theme'),false);assert.equal(d.querySelector('[data-reader-photo-state]').textContent,'Wird angezeigt');
assert.equal(d.querySelector('meta[name="theme-color"]').content,'#151515');
d.querySelector('#reader-theme-open').click();
const dialog=d.querySelector('.reader-theme-dialog');
assert.ok(dialog.open);assert.equal(dialog.querySelectorAll('input[type=radio]').length,6);
assert.equal(dialog.querySelector('input:checked').value,'standard');
const draft=d.createElement('input');draft.value='Unsaved note';d.querySelector('#content').appendChild(draft);
for(const id of ['dark','blue','green','violet','sand']){
 const radio=dialog.querySelector('[value="'+id+'"]');radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.dataset.readerTheme,id);assert.equal(w.localStorage.getItem(key),id);assert.equal(draft.value,'Unsaved note');assert.ok(draft.isConnected);
 const reload=setup(w.localStorage.getItem(key));assert.equal(reload.window.document.documentElement.dataset.readerTheme,id);reload.window.close();
}
const standard=dialog.querySelector('[value=standard]');standard.checked=true;standard.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(root.hasAttribute('data-reader-theme'),false);assert.equal(d.querySelector('meta[name="theme-color"]').content,'#151515');
dialog.querySelector('.reader-theme-close').click();assert.equal(dialog.open,false);assert.equal(d.activeElement.id,'reader-theme-open');
const invalid=setup('not-a-theme');assert.equal(invalid.window.document.documentElement.hasAttribute('data-reader-theme'),false);invalid.window.close();
const fresh=setup();assert.equal(fresh.window.document.documentElement.hasAttribute('data-reader-theme'),false);fresh.window.close();
const blocked=setup(null,true);blocked.window.document.querySelector('#reader-theme-open').click();blocked.window.document.querySelector('[value=dark]').click();assert.equal(blocked.window.document.documentElement.dataset.readerTheme,'dark');blocked.window.close();
const photoKey='fantastix.reader.daily-photo.device.v1';
const hide=d.querySelector('[name="reader-photo-visibility"]');assert.equal(hide.getAttribute('role'),'switch');hide.checked=false;hide.dispatchEvent(new w.Event('change',{bubbles:true}));
const photoReload=setup(null,false,'hidden');assert.equal(photoReload.window.FantastiXReaderSettings.showDailyPhoto(),false);photoReload.window.close();
assert.equal(w.FantastiXReaderSettings.showDailyPhoto(),false);assert.equal(d.querySelector('[data-reader-photo-state]').textContent,'Ausgeblendet');assert.equal(w.localStorage.getItem(photoKey),'hidden');
d.querySelector('#content').innerHTML=w.FantastiXReaderSettings.card();assert.equal(d.querySelector('[name="reader-photo-visibility"]').checked,false);
const show=d.querySelector('[name="reader-photo-visibility"]');show.checked=true;show.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(w.FantastiXReaderSettings.showDailyPhoto(),true);assert.equal(d.querySelector('[data-reader-photo-state]').textContent,'Wird angezeigt');assert.doesNotMatch(d.querySelector('#content').textContent,/Wird auf diesem Gerät gespeichert/);
assert.equal(w.localStorage.length,2);assert.doesNotMatch(fs.readFileSync(__dirname+'/index.html','utf8'),/reader-themes\.(js|css)/);
const migrated=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),mw=migrated.window;
mw.sessionStorage.setItem('fantastix.reader.theme.session.v1','sand');mw.sessionStorage.setItem('fantastix.reader.daily-photo.session.v1','hidden');mw.eval(source);
assert.equal(mw.document.documentElement.dataset.readerTheme,'sand');assert.equal(mw.localStorage.getItem(key),'sand');assert.equal(mw.FantastiXReaderSettings.showDailyPhoto(),false);assert.equal(mw.localStorage.getItem(photoKey),'hidden');migrated.window.close();
dom.window.close();
console.log('PASS six reader themes, default restored, device persistence/isolation, blocked storage fallback, preserved drafts, focus return, no account writes and admin isolation.');
