// Synthetic records and delayed reads: exercise both real inbox flows without network access.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
function setup(admin){
 const source=fs.readFileSync(__dirname+'/'+(admin?'app.js':'lesen.js'),'utf8');
 const dom=new JSDOM(fs.readFileSync(__dirname+'/'+(admin?'index.html':'lesen.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.alert=()=>{};w.scrollTo=()=>{};w.Notification={permission:'granted'};w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;this.querySelector('button')?.focus();};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.eval(source.split(admin?'/* Interaktionen */':"document.addEventListener('submit'")[0]+'\nwindow.run=code=>eval(code);');
 w.eval(fs.readFileSync(__dirname+'/ui-icons.js','utf8'));
 const start=source.indexOf("document.addEventListener('click'"),end=source.indexOf(admin?"document.addEventListener('submit'":"$('#notice-dialog').addEventListener",start);
 w.run(source.slice(start,end));
 if(!admin)w.run(source.slice(source.indexOf("$('#notice-dialog').addEventListener('cancel'"),source.indexOf("navigator.serviceWorker?.addEventListener('message'")));
 w.fixture={members:[{id:'a',name:'Alex'}],meetings:[],excursions:[],fines:[],payments:[],sections:{members:true,meetings:true}};
 w.records=[{id:1,kind:'announcement',title:'Neu <Test>',body:'Hallo <Team>',created_at:'2026-11-11T12:00:00Z'},{id:2,kind:'fine',title:'Strafe',body:'Zu spät',created_at:'2026-11-10T12:00:00Z'}];
 w.run(admin?"data=window.fixture;cloudUser={id:'admin'};fxNewAlerts=window.records;render();":"data=window.fixture;profile={member_id:'a'};user={id:'reader'};readerUpdates=window.records;renderApp();");
 return {dom,w,doc:w.document,run:w.run};
}
(async()=>{
 for(const admin of [false,true]){
  const {dom,w,doc,run}=setup(admin);
  const trigger=()=>doc.querySelector(admin?'.fx-bell':'#reader-bell');
  let opening,release;
  if(admin){w.pending=new Promise(resolve=>release=resolve);run("fxLoadAlerts=async()=>{await window.pending;};fxLoadNewAlerts=async()=>{};");opening=run('fxOpenInbox()');}
  else trigger().click();
  const dialog=doc.querySelector(admin?'#dialog':'#reader-inbox-dialog');
  assert.ok(dialog.open,'Inbox opens immediately, before the admin background fetch');
  assert.equal(dialog.querySelectorAll('h2').length,1,'One title, no duplicate modal header');
  assert.equal(dialog.querySelector('h2').textContent,'Benachrichtigungen');
  assert.doesNotMatch(dialog.innerHTML,/🔔/,'Old bell icon removed from the opened menu');
  assert.equal(dialog.querySelectorAll('[data-inbox-close]').length,1);
  dialog.querySelector('[data-inbox-close]').focus();run(admin?'paintAdminInbox()':'paintReaderInbox()');assert.ok(doc.activeElement.hasAttribute('data-inbox-close'),'Header refresh keeps close-button focus');
  assert.equal(trigger().getAttribute('aria-expanded'),'true');
  assert.equal(dialog.querySelector('.fx-inbox-item strong').textContent,'Neu <Test>');
  assert.equal(dialog.querySelector('.fx-inbox-item strong test'),null);
  const list=dialog.querySelector('.fx-inbox-list');list.scrollTop=140;
  const action=dialog.querySelector(admin?'[data-action="fx-new-read"]':'[data-reader-read]');action.focus();
  run(admin?'paintAdminInbox()':'paintReaderInbox()');
  assert.equal(dialog.querySelector('.fx-inbox-list').scrollTop,140);
  assert.equal(doc.activeElement.dataset[admin?'id':'readerRead'],'1','Updating records preserves keyboard focus');
  dialog.querySelector('[data-inbox-close]').click();
  assert.ok(dialog.classList.contains('is-closing'));
  if(admin){release();await opening;}else run('renderApp()');
  assert.ok(dialog.classList.contains('is-closing'),'A late refresh does not cancel closing');
  await new Promise(resolve=>setTimeout(resolve,190));
  assert.equal(dialog.open,false);assert.equal(doc.activeElement,trigger());assert.equal(trigger().getAttribute('aria-expanded'),'false');
  if(!admin)assert.equal(run('readerInboxOpen'),false);
  w.matchMedia=()=>({matches:true});
  if(admin)await run('fxOpenInbox()');else trigger().click();
  const cancel=new w.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented,true);assert.equal(dialog.open,false,'Reduced-motion users close without a delay');
  if(!admin){trigger().click();run('renderGate()');assert.equal(dialog.open,false,'Losing access dismisses the notification window');assert.equal(run('readerInboxOpen'),false);}
  if(admin){run("modal('Anderer Dialog','<p>Editor</p>');paintAdminInbox();");assert.equal(dialog.classList.contains('fx-inbox-dialog'),false);assert.match(dialog.textContent,/Anderer Dialog/);assert.equal(dialog.getAttribute('aria-label'),'Anderer Dialog');assert.doesNotMatch(dialog.textContent,/Benachrichtigungen/);}
  dom.window.close();
 }
 console.log('PASS inbox UI: immediate opening, single title without old bell, escaped content, stable scroll/focus, smooth close, late response guard, Escape, reduced motion and isolation from other dialogs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
