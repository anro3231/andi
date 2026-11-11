// Session-only settings, synthetic DOM, no account or network access.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
const source=fs.readFileSync(__dirname+'/reader-themes.js','utf8'),key='fantastix.reader.theme.session.v1';
const html=fs.readFileSync(__dirname+'/lesen.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
function setup(saved,blocked=false){
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(saved)w.sessionStorage.setItem(key,saved);
 if(blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 w.eval(source);return dom;
}
const dom=setup(),w=dom.window,d=w.document,root=d.documentElement;
assert.equal(root.hasAttribute('data-reader-theme'),false);
assert.equal(d.querySelector('meta[name="theme-color"]').content,'#151515');
d.querySelector('#reader-theme-open').click();
const dialog=d.querySelector('.reader-theme-dialog');
assert.ok(dialog.open);assert.equal(dialog.querySelectorAll('input[type=radio]').length,4);
assert.equal(dialog.querySelector('input:checked').value,'standard');
const draft=d.createElement('input');draft.value='Unsaved note';d.querySelector('#content').appendChild(draft);
for(const id of ['dark','blue','green']){
 const radio=dialog.querySelector('[value="'+id+'"]');radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(root.dataset.readerTheme,id);assert.equal(w.sessionStorage.getItem(key),id);assert.equal(draft.value,'Unsaved note');assert.ok(draft.isConnected);
 const reload=setup(w.sessionStorage.getItem(key));assert.equal(reload.window.document.documentElement.dataset.readerTheme,id);reload.window.close();
}
const standard=dialog.querySelector('[value=standard]');standard.checked=true;standard.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(root.hasAttribute('data-reader-theme'),false);assert.equal(d.querySelector('meta[name="theme-color"]').content,'#151515');
dialog.querySelector('.reader-theme-close').click();assert.equal(dialog.open,false);assert.equal(d.activeElement.id,'reader-theme-open');
const invalid=setup('not-a-theme');assert.equal(invalid.window.document.documentElement.hasAttribute('data-reader-theme'),false);invalid.window.close();
const fresh=setup();assert.equal(fresh.window.document.documentElement.hasAttribute('data-reader-theme'),false);fresh.window.close();
const blocked=setup(null,true);blocked.window.document.querySelector('#reader-theme-open').click();blocked.window.document.querySelector('[value=dark]').click();assert.equal(blocked.window.document.documentElement.dataset.readerTheme,'dark');blocked.window.close();
assert.equal(w.localStorage.length,0);assert.doesNotMatch(fs.readFileSync(__dirname+'/index.html','utf8'),/reader-themes\.(js|css)/);
dom.window.close();
console.log('PASS four reader themes, default restored, session persistence/isolation, blocked storage fallback, preserved drafts, focus return, no account/localStorage writes and admin isolation.');
