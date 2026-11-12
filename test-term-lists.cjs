// Real list renderers and delegated clicks, synthetic records and a fixed clock.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
function setup(admin){
 const source=fs.readFileSync(__dirname+'/'+(admin?'app.js':'lesen.js'),'utf8');
 const dom=new JSDOM(fs.readFileSync(__dirname+'/'+(admin?'index.html':'lesen.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};w.alert=()=>{};w.confirm=()=>true;w.Notification={permission:'granted'};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 const BaseDate=w.Date;w.Date=class extends BaseDate{constructor(...args){super(...(args.length?args:['2026-11-12T12:00:00Z']));}static now(){return new this().getTime();}};
 w.eval(source.split(admin?'/* Interaktionen */':"document.addEventListener('submit'")[0]+'\nwindow.run=code=>eval(code);');w.eval(fs.readFileSync(__dirname+'/ui-icons.js','utf8'));
 const start=source.indexOf("document.addEventListener('click'"),end=source.indexOf(admin?"document.addEventListener('submit'":"$('#notice-dialog').addEventListener",start);w.run(source.slice(start,end));
 w.fixture={members:[{id:'a',name:'Alex <A>'}],meetings:[{id:'later',date:'2026-12-01',time:'20:00'},{id:'old',date:'2026-09-01'},{id:'next',date:'2026-11-13',time:'18:30',location:'Gasthaus <Ort>',organizerId:'a',attendance:{a:{status:'present'}}},{id:'today',date:'2026-11-12'},{id:'recent',date:'2026-11-01'}],excursions:[{id:'late',title:'Spät',date:'2026-12-20'},{id:'early',title:'Event <Test>',date:'2026-11-15',time:'18:00',location:'Ort <Saal>',organizerIds:['a']},{id:'ongoing',title:'Wochenende',date:'2026-11-10',endDate:'2026-11-14'},{id:'past',title:'Vergangen',date:'2026-11-01'},{id:'undated',title:'Noch offen'},{id:'closed',title:'Schon abgeschlossen',date:'2026-12-25',completed:true}],fines:[],payments:[],sections:{meetings:true,members:true,excursions:true}};
 w.run("data=window.fixture;"+(admin?"page='meetings';render();":"user={id:'reader'};profile={member_id:'a'};tab='meetings';renderApp();"));
 return {dom,w,doc:w.document,run:w.run};
}
(async()=>{
 for(const admin of [false,true]){
  const {dom,w,doc,run}=setup(admin),root=()=>doc.querySelector(admin?'#app':'#content');
  const ids=()=>[...root().querySelectorAll('.reader-entry')].map(b=>admin?b.dataset.id:(b.dataset.readerMeeting||b.dataset.readerExcursion));
  assert.deepEqual(ids(),['today','next','later','recent','old']);
  assert.deepEqual([...root().querySelectorAll('.term-list')].map(g=>g.getAttribute('aria-label')),['Anstehend','Vergangen']);
  const next=root().querySelector(admin?'[data-id=next]':'[data-reader-meeting=next]');
  assert.equal(next.querySelector('.next-date').textContent,run(admin?"fmtDate('2026-11-13')":"dateLabel('2026-11-13')"));assert.ok(next.querySelector('.next-date-row .next-calendar svg'));assert.equal(next.querySelector('.meeting-status'),null);assert.equal(next.querySelector('.reader-entry-end'),null);
  assert.equal(next.querySelectorAll('.term-entry-meta svg').length,3);assert.match(next.textContent,/18:30 Uhr/);assert.match(next.textContent,/Gasthaus <Ort>/);assert.match(next.textContent,/Alex <A>/);assert.equal(next.querySelector('ort'),null);
  assert.ok(next.querySelector('[aria-label="1 Zusagen"] svg'));assert.equal(next.querySelectorAll('button').length,0,'Whole row is one action, no nested controls');
  assert.equal(root().querySelectorAll('.reader-entry .meeting-status').length,0);
  next.querySelector('.term-entry-meta svg').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  await Promise.resolve();assert.equal(run(admin?'adminEntry.kind':'readerEntry.kind'),'meeting');assert.equal(run(admin?'adminEntry.id':'readerEntry.id'),'next');
  run(admin?"adminEntry=null;page='excursions';render();":"readerEntry=null;tab='excursions';renderApp();");
  assert.deepEqual(ids(),['ongoing','early','late','undated','closed','past']);
  assert.deepEqual([...root().querySelectorAll('.term-list')].map(g=>g.getAttribute('aria-label')),['Anstehend','Noch ohne Termin','Vergangen']);
  const early=root().querySelector(admin?'[data-id=early]':'[data-reader-excursion=early]');assert.equal(early.querySelectorAll('.term-entry-meta svg').length,3);assert.equal(early.querySelector('.term-entry-title').textContent,'Event <Test>');assert.match(early.textContent,/18:00 Uhr/);assert.equal((early.textContent.match(/18:00/g)||[]).length,1);
  const ongoing=root().querySelector(admin?'[data-id=ongoing]':'[data-reader-excursion=ongoing]');assert.equal(ongoing.closest('.term-list').getAttribute('aria-label'),'Anstehend');assert.equal(ongoing.querySelector('.meeting-status'),null);assert.match(ongoing.textContent,/–/);
  const undated=root().querySelector(admin?'[data-id=undated]':'[data-reader-excursion=undated]');assert.match(undated.textContent,/Termin offen/);assert.match(undated.textContent,/Uhrzeit noch offen/);assert.match(undated.textContent,/Ort noch offen/);assert.doesNotMatch(undated.textContent,/NaN|undefined/);
  early.querySelector('.term-entry-open svg').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await Promise.resolve();assert.equal(run(admin?'adminEntry.kind':'readerEntry.kind'),'excursion');assert.equal(run(admin?'adminEntry.id':'readerEntry.id'),'early');
  if(!admin){run("readerEntry=null;data.sections.members=false;tab='meetings';renderApp();");assert.equal(root().querySelector('.reader-counts'),null);assert.doesNotMatch(root().textContent,/Organisator:/);run("data.sections.meetings=false;");assert.doesNotMatch(run('meetings()'),/data-reader-meeting=/);assert.match(run('meetings()'),/nicht freigegeben/);}
  run(admin?"adminEntry=null;data.meetings=[];data.excursions=[];page='meetings';render();":"readerEntry=null;data.sections.meetings=true;data.meetings=[];data.excursions=[];tab='meetings';renderApp();");assert.match(root().textContent,/Noch keine Stammtische/);assert.equal(root().querySelector('.term-list-heading'),null);
  run(admin?"page='excursions';render();":"tab='excursions';renderApp();");assert.match(root().textContent,/Noch keine Events/);assert.ok(root().querySelector(admin?'[data-action=excursion-new]':'[data-member-event-new]'));
  dom.window.close();
 }
 console.log('PASS term lists: matching groups/order in both modes, dashboard date rows/icons, counts, safe text, ongoing/undated/completed events, unchanged delegated detail clicks, permissions and empty states.');
})().catch(e=>{console.error(e);process.exitCode=1;});
