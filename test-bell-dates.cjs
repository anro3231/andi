// Synthetic notification fixtures; no database or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const mode of ['admin','reader']){
 const ctx=vm.createContext({window:{},localStorage:{getItem:()=>null}});
 const file=mode==='admin'?'app.js':'lesen.js',source=fs.readFileSync(__dirname+'/'+file,'utf8');
 vm.runInContext(source.split(mode==='admin'?'/* Interaktionen */':"document.addEventListener('submit'")[0],ctx);
 const run=code=>vm.runInContext(code,ctx);
 const fixtures=[
  {id:1,kind:'event',title:'Event am 2026-11-09',body:'Neuer Termin: 2026-11-09 19:45 · Gasthaus.',created_at:'2026-11-08T23:30:00Z'},
  {id:2,kind:'schedule',title:'Termin geändert',body:'Von 2026-11-09 auf 2026-11-10 um 18:30 Uhr.',created_at:'2026-01-02T10:05:00Z'},
  {id:3,kind:'announcement',title:'<img src=x onerror=alert(1)> 2.1.2026',body:'Info 3.2.2026: https://example.test/2026-11-09 bleibt.',created_at:null}
 ];
 ctx.fixtures=fixtures;
 const html=mode==='admin'?(run('fxNewAlerts=fixtures'),run('fxInboxHTML()')):(run('readerUpdates=fixtures'),run('readerInbox()'));
 assert.match(html,/Event am 09\.11\.2026/);assert.match(html,/Neuer Termin: 09\.11\.2026 19:45/);
 assert.match(html,/Von 09\.11\.2026 auf 10\.11\.2026 um 18:30 Uhr/);
 assert.match(html,/09\.11\.2026, 00:30/,'Timestamp uses Vienna, including the date boundary');
 assert.match(html,/02\.01\.2026, 11:05/);
 assert.match(html,/03\.02\.2026/);assert.match(html,/https:\/\/example.test\/2026-11-09/,'URLs remain intact');
 assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img src=x/);
 assert.equal(run("bellTimestamp('broken')"),'–');
 assert.equal(run("bellDateText('29.02.2028 und 2028-02-29')"),'29.02.2028 und 29.02.2028');
 console.log('PASS '+mode+' bell dates: title, body, padded dates, calendar-day preservation, Vienna timestamps, escaping and URLs.');
}
