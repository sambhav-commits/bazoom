import fs from 'node:fs';
import assert from 'node:assert/strict';

const sourcePath=process.argv[2];
if(!sourcePath){console.error('Usage: node scripts/audit-content.mjs <path-to-CONTENT.txt>');process.exit(2)}
const source=fs.readFileSync(sourcePath,'utf8').replaceAll('\r\n','\n');
const data=JSON.parse(fs.readFileSync('lib/data.json','utf8'));
const stored=JSON.parse(fs.readFileSync('lib/sections.json','utf8'));
const headings=[...source.matchAll(/^# (M\d+|A\d+) — ([^\n]+)/gm)];
const sections={};
for(let i=0;i<headings.length;i++){
  const h=headings[i],start=h.index+h[0].length;
  const end=i+1<headings.length?headings[i+1].index:source.indexOf('# CLOSING SLIDE',start);
  sections[h[1]]={title:h[2],body:source.slice(start,end).trim().replace(/\n---\s*$/,'').trim()};
}
const checks=[];
function check(name,run){try{run();checks.push({name,status:'PASS'});console.log('PASS',name)}catch(error){checks.push({name,status:'FAIL',detail:error.message});console.error('FAIL',name,error.message)}}
function tableRows(text,header){
  const start=text.indexOf(header);assert(start>=0,`Missing table ${header}`);
  const rows=[];
  for(const line of text.slice(start).split('\n').slice(2)){
    if(!line.startsWith('|'))break;
    rows.push(line.split('|').slice(1,-1).map(cell=>cell.trim()));
  }
  return rows;
}
check('All 22 solution and appendix sections are verbatim',()=>{
  assert.equal(headings.length,22);
  for(const [id,section] of Object.entries(sections))assert.deepEqual(stored[id],section,id);
});
check('Network, allocation, event and candidate counts',()=>{
  assert.equal(data.entities.length,30);
  assert.deepEqual([1,2,3].map(t=>data.entities.filter(e=>e.tier===t).length),[8,10,5]);
  assert.equal(data.links.filter(l=>l.type==='Supply'&&l.status==='Confirmed').length,29);
  assert.equal(data.links.filter(l=>l.status==='Provisional').length,1);
  assert.equal(data.links.filter(l=>l.type==='Ownership').length,3);
  assert.equal(data.allocations.length,10);
  assert.equal(data.evidence.length,59);
  assert.equal(data.events.length,8);
  assert.equal(data.routes.length,9);
  assert.equal(data.candidates.length,28);
});
check('A4 raw financial, operating and geographic inputs',()=>{
  const rows=tableRows(sections.A4.body,'| Entity | CR | ND/E |');
  const byName=new Map(rows.map(r=>[r[0],r]));
  for(const e of data.entities.filter(e=>e.tier)){
    const r=byName.get(e.short);assert(r,`Missing A4 ${e.short}`);
    const keys=['cr','debt','timeliness','change','assurance','hazard','logistics','infrastructure'];
    for(let i=0;i<keys.length;i++){
      const text=r[i+1].replace('−','-').replace('+','');
      const expected=text==='—'?null:Number(text);
      const actual=e.indicators[keys[i]];
      if(expected===null)assert.equal(actual,null,`${e.short} ${keys[i]}`);
      else assert(Math.abs(actual-expected)<.005,`${e.short} ${keys[i]} ${actual} vs ${expected}`);
    }
  }
});
check('A6 all 115 P3 reference cells',()=>{
  const rows=tableRows(sections.A6.body,'| Manufacturer | Base | Finance emphasis |');
  assert.equal(rows.length,23);
  for(const r of rows)assert.deepEqual(data.expected[r[0]],r.slice(1,6),r[0]);
});
check('M6 six switching-load calculations',()=>{
  const rows=tableRows(sections.M6.body,'| Existing switch | Planned share change |');
  assert.deepEqual(data.switchMultiples,rows.map(r=>r.slice(0,4)));
});
check('M7 nine route screens',()=>{
  const rows=tableRows(sections.M7.body,'| Route | Candidate screen |');
  assert.deepEqual(data.routes,rows.map(r=>({route:r[0],screen:r[1],treatment:r[2]})));
});
check('M9 seven complete-component or common-input routes',()=>{
  const rows=tableRows(sections.M9.body,'| Component or input | Capability-screened route |');
  assert.deepEqual(data.componentRoutes,rows.map(r=>r.slice(0,3)));
});
check('A12 all 25 acceptance expectations',()=>{
  const rows=tableRows(sections.A12.body,'| ID | Test | Expected result |');
  assert.deepEqual(data.tests,rows.map(r=>({id:r[0],name:r[1],expected:r[2]})));
});
if(checks.some(x=>x.status==='FAIL'))process.exitCode=1;
