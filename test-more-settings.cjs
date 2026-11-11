// Synthetic settings UI; no accounts, uploads or notifications are touched.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
function env(admin){
 const dom=new JSDOM(fs.readFileSync(__dirname+(admin?'/index.html':'/lesen.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.alert=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.eval(fs.readFileSync(__dirname+'/ui-icons.js','utf8'));if(!admin)w.eval(fs.readFileSync(__dirname+'/reader-themes.js','utf8'));
 const source=fs.readFileSync(__dirname+(admin?'/app.js':'/lesen.js'),'utf8');w.eval(source.split(admin?'/* Interaktionen */':"document.addEventListener('submit'")[0]+'\nwindow.run=code=>eval(code);');
 const run=w.run;run("data={members:[{id:'a',name:'Anna'}],meetings:[],excursions:[],fines:[],payments:[],sections:{members:true,meetings:true,excursions:true,cash:true,fines:true}};");
 run(admin?"page='settings';cloudUser={id:'admin'};cloudReady=true;render();":"profile={member_id:'a'};user={id:'reader'};showPushOptIn=()=>{};tab='more';renderApp();");
 return {dom,w,d,run};
}
const admin=env(true),reader=env(false);
assert.equal(admin.d.querySelector('[data-page=settings] svg').outerHTML,reader.d.querySelector('[data-tab=more] svg').outerHTML,'Same More icon');
const adminNavigation=[...admin.d.querySelectorAll('#nav .navbutton')],readerNavigation=[...reader.d.querySelectorAll('#tabs .navbutton')];
assert.deepEqual(adminNavigation.map(b=>b.lastElementChild.textContent),['Start','Stammtisch','Events','Kalender','Rangliste','Mitglieder','Kassa','Mehr']);
assert.deepEqual(adminNavigation.map(b=>b.lastElementChild.textContent),readerNavigation.map(b=>b.lastElementChild.textContent));
adminNavigation.forEach((button,i)=>{assert.equal(button.querySelector('.tab-icon').innerHTML,readerNavigation[i].querySelector('.tab-icon').innerHTML);assert.equal(button.type,readerNavigation[i].type);});

assert.equal(reader.d.querySelector('.reader-head-actions #reader-theme-open'),null);
assert.ok(reader.d.querySelector('.reader-display-settings #reader-theme-open'));
reader.d.querySelector('#reader-theme-open').click();assert.equal(reader.d.querySelectorAll('.reader-theme-dialog input[type=radio]').length,6);reader.d.querySelector('.reader-theme-close').click();
reader.w.FantastiXPhotos={card:()=>'<section class="card daily-photo-card"><div data-daily-photo></div></section>',configure(){},hydrate(){}};
assert.match(reader.run('dashboard()'),/daily-photo-card/);
const hide=reader.d.querySelector('[role=switch][name=reader-photo-visibility]');hide.checked=false;hide.dispatchEvent(new reader.w.Event('change',{bubbles:true}));
assert.doesNotMatch(reader.run('dashboard()'),/daily-photo-card/,'Hidden daily photo is not mounted or fetched');
reader.run("tab='more';renderApp()");assert.equal(reader.d.querySelector('[name=reader-photo-visibility]').checked,false);
reader.d.querySelector('[name=reader-photo-visibility]').click();assert.match(reader.run('dashboard()'),/daily-photo-card/);
const titles=[...admin.d.querySelectorAll('.admin-more>.card h2')].map(x=>x.textContent);
assert.deepEqual(titles,['Cloud & Benutzer','Abstimmungen & Nachrichten','Stammtisch-Bilder','Sicherungen & Änderungsverlauf']);
for(const action of ['cloud-setup','cloud-check','reader-access','vote-settings','notice-new','notice-manage','push-admin','backup-list','audit-list','snapshot-list','share-json','export-json'])assert.equal(admin.d.querySelectorAll('.admin-more [data-action="'+action+'"]').length,1,action);
assert.ok(admin.d.querySelector('[data-photo-manage]'));assert.ok(admin.d.querySelector('#backupFile'));
assert.ok([...admin.d.querySelectorAll('.admin-more details')].every(x=>!x.open));
assert.ok(admin.d.querySelector('[data-action=push-admin]').closest('section').querySelector('[data-action=notice-new]'));
admin.run("snapshotError=true;snapshotStatus='Backup failed';render()");assert.match(admin.d.querySelector('[role=alert]').textContent,/Backup failed/);assert.equal(admin.d.querySelector('[role=alert]').closest('details'),null);
admin.dom.window.close();reader.dom.window.close();
console.log('PASS shared More icon, reader-only appearance menu, six themes, daily photo show/hide without mounting, grouped admin actions, collapsed help and visible errors.');
