import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('lib/model.ts','utf8').replace("import raw from './data.json';",`const raw = ${fs.readFileSync('lib/data.json','utf8')};`);
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};new Function('module','exports',compiled)(module,module.exports);
const {data,score,scoreP2,interval,confirmed,componentsFor,exposure,actionFloor,validateRecord,GATES}=module.exports;
const checked=[];function test(name,fn){try{fn();checked.push({name,status:'PASS'});console.log('PASS',name)}catch(e){checked.push({name,status:'FAIL',error:e.message});console.error('FAIL',name,e.message)}}
test('Case universe and distinct relationship types',()=>{
  assert.equal(data.entities.length,30);assert.equal(confirmed.length,23);
  assert.deepEqual([1,2,3].map(t=>confirmed.filter(e=>e.tier===t).length),[8,10,5]);
  assert.equal(data.links.filter(l=>l.type==='Supply'&&l.status==='Confirmed').length,29);
  assert.equal(data.allocations.length,10);assert.equal(data.links.filter(l=>l.type==='Ownership').length,3);
  assert.equal(data.evidence.length,59);assert.equal(data.events.length,8);
});
test('All 115 new P3 sensitivity cells match CONTENT.txt',()=>{
  const names=['Base','Finance emphasis','Geography emphasis','Condition emphasis','Structure emphasis'];
  for(const e of confirmed){const reference=data.expected[e.short];assert(reference,e.short);for(let i=0;i<5;i++)assert.equal(interval(score(e,names[i]).P),reference[i],`${e.short} ${names[i]}`)}
});
test('Required P3 positions and intervals',()=>{
  for(const [name,value] of [['Jade','79.0'],['IonPeak','78.2'],['Cobalt','76.9'],['Meridian','76.7'],['Delta','59.1'],['Umber','69.8–85.5']]){
    const e=confirmed.find(x=>x.short===name);assert.equal(interval(score(e).P),value,name);
  }
  const meridian=confirmed.find(x=>x.short==='Meridian');assert(Math.abs(score(meridian).C[0]-74.118)<1e-8);
  assert.equal(interval(scoreP2(meridian)),'74.0');
});
test('Path exposure and mandatory action floor',()=>{
  const find=n=>confirmed.find(e=>e.short===n);
  for(const [name,value] of [['Aster',70],['Boreal',40],['Cobalt',100],['Delta',100],['Grove',80],['HarborSense',20],['Jade',100]])assert.equal(exposure(find(name)),value,name);
  for(const name of ['Cobalt','Delta','Estuary','ForgeLine','IonPeak','Jade'])assert(actionFloor(find(name)),name);
  for(const name of ['ForgeLine','Grove','HarborSense'])assert.notEqual(score(find(name)).band,'Monitoring',name);
  assert.deepEqual(componentsFor(find('Meridian').id),['C20']);
});
test('New candidate universe and fit arithmetic',()=>{
  assert.equal(data.candidates.length,28);assert.equal(data.routes.length,9);
  for(const c of data.candidates)assert.equal(c.fit,c.ratings.reduce((n,v,i)=>n+v*[35,25,15,15,10][i]/5,0),`${c.name} ${c.route}`);
  assert.equal(new Set(data.candidates.map(c=>c.route)).size,9);
});
test('Unsupported approvals and unsupported closure are rejected',()=>{
  const gates=Object.fromEntries(GATES.map(g=>[g,{status:'Not started',evidence:'',date:''}]));
  assert.match(validateRecord('approvals',{id:'x',candidateId:data.candidates[0].id,gates,approved:true}),/Approval requires/);
  assert.match(validateRecord('actions',{id:'x',title:'Review',owner:'A',dueDate:'2026-10-14',status:'Closed'}),/Closure/);
});
const failed=checked.filter(c=>c.status==='FAIL');fs.mkdirSync('validation',{recursive:true});fs.writeFileSync('validation/calculations.json',JSON.stringify({build:'P3.0',date:new Date().toISOString(),checks:checked},null,2));if(failed.length)process.exitCode=1;
