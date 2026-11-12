// Real renderers, synthetic data, no network or account writes.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.FANTASTIX_JSDOM||'jsdom');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
function setup(admin){
 const dom=new JSDOM(read(admin?'index.html':'lesen.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};w.Notification={permission:'granted'};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.eval(read(admin?'app.js':'lesen.js').split(admin?'/* Interaktionen */':"document.addEventListener('submit'")[0]+'\nwindow.run=code=>eval(code);');w.eval(read('ui-icons.js'));
 w.fixture={members:['a','b','c'].map((id,i)=>({id,name:['Alex','Berta','Claus'][i]})),meetings:[{id:'m',date:'2099-11-13',time:'18:30',location:'Gasthaus',organizerId:'a',attendance:{a:{status:'present'},b:{status:'unsure'},c:{status:'absent'}}}],excursions:[{id:'e',title:'Advent <Abend>',date:'2099-11-28',endDate:'2099-11-29',time:'18:00',location:'Vereinslokal <Saal>',organizerIds:['a','b']}],fines:[],payments:[],sections:{members:true,meetings:true,excursions:true}};
 w.run("data=window.fixture;excursionVotes=[{excursion_id:'e',member_id:'a',status:'yes'},{excursion_id:'e',member_id:'b',status:'unsure'},{excursion_id:'e',member_id:'c',status:'no'}];"+(admin?"page='home';render();":"profile={member_id:'a'};user={id:'u'};deadlines.set('m','2099-11-12T18:00:00Z');tab='dashboard';renderApp();"));
 return {dom,w,doc:w.document,run:w.run};
}
for(const admin of [false,true]){
 const {dom,w,doc,run}=setup(admin),card=doc.querySelector('.excursion-preview');
 assert.ok(card.classList.contains('next-card'));assert.equal(card.querySelectorAll('.next-meta svg').length,2);assert.equal(card.querySelectorAll('.event-organizer svg').length,1);
 assert.equal(card.querySelector('.next-calendar svg').outerHTML,doc.querySelector('.next-card:not(.excursion-preview) .next-calendar svg').outerHTML);
 assert.equal(card.querySelector('.next-event-title').textContent,'Advent <Abend>');assert.match(card.querySelector('.event-date').textContent,/2099.*–.*2099/);assert.equal(card.querySelector('.next-meta').textContent,'18:00 UhrVereinslokal <Saal>');
 const button=card.querySelector('button');assert.equal(button.className,'ghost');assert.equal(button.textContent,admin?'Events ansehen →':'Öffnen →');assert.equal(button.dataset[admin?'page':'readerExcursion'],admin?'excursions':'e');
 for(const status of ['present','yes','absent','no','unsure']){
  const holder=doc.createElement('div');holder.innerHTML=run(`voteStatusHTML('${status}')`);const expected=doc.createElement('div');expected.innerHTML=w.FantastixUI.voteIcon(status);assert.equal(holder.querySelector('svg').outerHTML,expected.querySelector('svg').outerHTML);assert.doesNotMatch(holder.textContent,/👍|👎|❓/);
 }
 if(admin){
  run("meetingForm('m')");for(const b of doc.querySelectorAll('.seg button')){const expected=doc.createElement('div');expected.innerHTML=w.FantastixUI.voteIcon(b.dataset.status);assert.equal(b.querySelector('svg').outerHTML,expected.querySelector('svg').outerHTML);}
  run("excursionForm('e');excursionVotes[0].status='no';updateExcursionVoteControls('e')");
  assert.ok(doc.querySelector('#excursion-vote-count [aria-label="2 Absagen"] svg'));
  const expected=doc.createElement('div');expected.innerHTML=w.FantastixUI.voteIcon('no');assert.equal(doc.querySelector('[data-excursion-row="a"] .excursion-vote-label svg').outerHTML,expected.querySelector('svg').outerHTML);
  for(const b of doc.querySelectorAll('.excursion-admin-choice:not([data-status=clear])'))assert.ok(b.querySelector('svg'));
 }else{
  const panel=doc.createElement('div');panel.innerHTML=run('votePanel(data.meetings[0])');assert.equal(panel.querySelectorAll('.vote-btn svg').length,3);
  panel.innerHTML=run('excursionRoster(data.excursions[0])');assert.equal(panel.querySelectorAll('.chip svg').length,3);assert.equal(panel.querySelectorAll('.reader-counts svg').length,3);
 }
 run("data.excursions[0].date='';data.excursions[0].endDate='';data.excursions[0].time='';data.excursions[0].location=''");
 const open=doc.createElement('div');open.innerHTML=run('nextEventDetails(data.excursions[0])');assert.match(open.textContent,/Termin offen/);assert.match(open.textContent,/Uhrzeit noch offen/);assert.match(open.textContent,/Ort noch offen/);
 dom.window.close();
}
// Check all defined text/background pairs rather than trusting palette names.
const css=read('reader-themes.css'),themeSource=read('reader-themes.js');
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const id of ['dark','blue','green','violet','sand']){
 const rule=css.match(new RegExp(':root\\[data-reader-theme='+id+'\\]\\{([^}]+)\\}'))[1];const tokens=Object.fromEntries([...rule.matchAll(/--([\w-]+):(#[\da-f]{6})/g)].map(m=>[m[1],m[2]]));
 for(const [fg,bg] of [['ink','bg'],['ink','surface'],['ink','theme-feature'],['muted','surface'],['muted','theme-feature'],['muted','theme-tint'],['accent','surface'],['accent','theme-soft'],['theme-on-accent','accent'],['theme-on-accent','accent-dark'],['theme-on-hero','theme-hero'],['theme-yes-ink','theme-yes-bg'],['theme-no-ink','theme-no-bg'],['theme-unsure-ink','theme-unsure-bg']])assert.ok(ratio(tokens[fg],tokens[bg])>=4.5,`${id}: ${fg}/${bg} contrast ${ratio(tokens[fg],tokens[bg]).toFixed(2)}`);
 const preview=css.match(new RegExp('\\.theme-preview-'+id+'\\{([^}]+)\\}'))[1];for(const key of ['bg','surface','ink','accent'])assert.ok(preview.includes('--preview-'+key+':'+tokens[key]));assert.ok(themeSource.includes("color:'"+tokens.bg+"'"));
}
// Adding the alternative palettes must not alter the standard page's colors.
const {dom,w,doc}=setup(false);const base=doc.createElement('style');base.textContent=read('modern.css');doc.head.appendChild(base);
const selectors=['body','.next-card','.ghost','.readonly-nav .active','.reader-bell'];
const snapshot=()=>selectors.map(s=>{const c=w.getComputedStyle(doc.querySelector(s));return [c.color,c.backgroundColor,c.borderColor];});
const standard=snapshot();const alternatives=doc.createElement('style');alternatives.textContent=css;doc.head.appendChild(alternatives);assert.deepEqual(snapshot(),standard);
for(const id of ['dark','blue','green','violet','sand'])doc.documentElement.dataset.readerTheme=id;
doc.documentElement.removeAttribute('data-reader-theme');assert.deepEqual(snapshot(),standard);dom.window.close();
console.log('PASS appearance consistency: shared vote SVGs including live admin updates, matching event metadata with unchanged action, missing/range dates, five readable palettes and matching previews, unchanged standard colors.');
