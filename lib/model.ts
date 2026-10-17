import raw from './data.json';
export const data: any = raw;
export type Weights = { c:[number,number,number]; p:[number,number,number,number] };
export const scenarios: Record<string,Weights> = {
  Base:{c:[.35,.35,.30],p:[.45,.25,.20,.10]},
  'Finance emphasis':{c:[.50,.30,.20],p:[.45,.25,.20,.10]},
  'Geography emphasis':{c:[.25,.30,.45],p:[.45,.25,.20,.10]},
  'Condition emphasis':{c:[.35,.35,.30],p:[.60,.20,.15,.05]},
  'Structure emphasis':{c:[.35,.35,.30],p:[.30,.25,.30,.15]}
};
export const entity=(id:string)=>data.entities.find((e:any)=>e.id===id);
const clip=(n:number)=>Math.min(100,Math.max(0,n));
export function downstream(id:string){
  const found=new Set([id]);let changed=true;
  while(changed){changed=false;for(const l of data.links){if(l.type==='Supply'&&l.status==='Confirmed'&&found.has(l.source)&&!found.has(l.target)){found.add(l.target);changed=true}}}
  return found;
}
export function componentsFor(id:string){
  const reachable=downstream(id);
  return [...new Set(data.allocations.filter((a:any)=>reachable.has(a.entity)).map((a:any)=>a.component))] as string[];
}
export function exposure(e:any){
  if(e.tier===1)return Math.max(...data.allocations.filter((a:any)=>a.entity===e.id).map((a:any)=>a.share),0);
  if(!e.tier)return 0;
  const reachable=downstream(e.id);
  return Math.max(...data.allocations.filter((a:any)=>reachable.has(a.entity)).map((a:any)=>a.share),0)===0?0:100;
}
export function actionFloor(e:any){
  if(e.tier===1&&data.allocations.some((a:any)=>a.entity===e.id&&a.share===100))return '100% disclosed component award';
  if(['ORG-439','ORG-453'].some(id=>downstream(id).has(e.id)))return 'Shared qualified input without approved independent source';
  return '';
}
export function score(e:any,scenario='Base',custom?:Weights){
  const i=e.indicators,w=custom||scenarios[scenario]||scenarios.Base;
  const cr=i.cr==null?null:i.cr<.75?100:i.cr<1?75:i.cr<1.5?50:i.cr<2?25:0;
  const debt=i.debt==null?null:i.debt>=6?100:i.debt>=4?75:i.debt>=3?50:i.debt>=2?25:0;
  const F=cr===null||debt===null?null:(cr+debt)/2;
  const D=clip(4*(100-i.timeliness)),T=clip(-5*i.change),O=.7*D+.3*T,G=(i.hazard+i.logistics)/2;
  const revenue=data.products.filter((p:any)=>e.products.includes(p.id)).reduce((n:number,p:any)=>n+p.revenue,0),B=revenue/1560*100;
  const S=e.S,E=exposure(e);
  const C=(F===null?[0,100]:[F]).map(f=>w.c[0]*f+w.c[1]*O+w.c[2]*G);
  const P=C.map(c=>w.p[0]*c+w.p[1]*B+w.p[2]*S+w.p[3]*E);
  const floor=actionFloor(e);
  const band=P[0]>=70?'Continuity workstream':P[0]>=55||floor?'Managed assessment':'Monitoring';
  return {F,D,T,O,G,B,S,E,C,P,revenue,missing:F===null,band,floor};
}
export function scoreP2(e:any){
  const s=score(e),historicS=['Cobalt','Delta','Estuary','ForgeLine'].includes(e.short)?75:s.S;
  return s.C.map((c:number)=>.45*c+.35*s.B+.20*historicS);
}
// All source values are non-negative. Rounding occurs only at display time.
export const one=(n:number)=>(Math.round((n+Number.EPSILON)*10)/10).toFixed(1);
export const interval=(values:number[])=>values.map(one).join('–');
export const confirmed=data.entities.filter((e:any)=>e.tier);
export function matches(e:any,f:Record<string,string>){return (!f.product||f.product==='all'||e.products.includes(f.product))&&(!f.component||f.component==='all'||componentsFor(e.id).includes(f.component))&&(!f.tier||f.tier==='all'||String(e.tier)===f.tier)&&(!f.zone||f.zone==='all'||e.zone===f.zone)&&(!f.search||`${e.name} ${e.id} ${e.site} ${e.capability}`.toLowerCase().includes(f.search.toLowerCase()));}
export const GATES=['Technical','Factory','Quality','Capacity','Independence','Supplier risk','Commercial','Release'];
export const ACTION_STATES=['Proposed','Assigned','Evidence requested','Under review','Action agreed','Monitoring','Closed','Reopened'];
export const SEED_ACTION={id:'ACT-MERIDIAN',entityId:'ORG-210',eventId:'EV-003',title:'Verify Meridian production, creditor restrictions, accepted orders, usable coverage and recovery',owner:'',dueDate:'',status:'Proposed',notes:'Owner target T0+24h; first evidence T0+72h; decision by Day 14. Supplier requests are planned.',closureEvidence:'',closureDate:''};
export function validateRecord(kind:string,p:any){
  if(!p||typeof p.id!=='string'||!p.id||p.id.length>100)return 'Invalid record identifier.';
  if(kind==='actions'){
    if(!p.title?.trim()||!ACTION_STATES.includes(p.status))return 'Action and valid status are required.';
    if(p.status!=='Proposed'&&(!p.owner?.trim()||!p.dueDate))return 'Assign an owner and due date.';
    if(p.status==='Closed'&&(!p.closureEvidence?.trim()||!p.closureDate))return 'Closure needs dated evidence.';
  }else if(kind==='alerts'){
    if(!data.events.some((e:any)=>e.id===p.eventId))return 'Unknown event.';
    if(!['New','Verifying','Action agreed','Monitoring','Closed','Reopened'].includes(p.status))return 'Invalid review status.';
    if(p.status!=='New'&&(!p.owner?.trim()||!p.dueDate))return 'Review owner and evidence deadline are required.';
    if(p.status==='Closed'&&(!p.closureEvidence?.trim()||!p.closureDate))return 'Closure needs dated evidence.';
  }else if(kind==='approvals'){
    if(!data.candidates.some((c:any)=>c.id===p.candidateId))return 'Unknown candidate.';
    for(const gate of GATES){const g=p.gates?.[gate];if(!g||!['Not started','Evidence requested','Under review','Passed','Failed'].includes(g.status))return 'Each gate needs a valid state.';if(g.status==='Passed'&&(!g.evidence?.trim()||!g.date))return 'A passed gate needs dated evidence.'}
    if(p.approved&&(!GATES.every(g=>p.gates[g].status==='Passed')||!p.factory?.trim()||!p.programme?.trim()||!p.volume?.trim()||!p.approver?.trim()||!p.validUntil))return 'Approval requires eight passed gates, factory, programme, volume, approver and validity.';
  }else if(kind==='models'){
    if(!p.name?.trim()||!p.rationale?.trim()||p.revision)return 'Save a named new version with a rationale.';
    for(const [a,len] of [[p.c,3],[p.p,4]] as const)if(!Array.isArray(a)||a.length!==len||a.some((v:any)=>typeof v!=='number'||v<0||v>1)||Math.abs(a.reduce((x:number,y:number)=>x+y,0)-1)>1e-8)return 'Condition and priority weights must each total 100%.';
  }else if(kind==='research'){
    if(!p.url?.startsWith('https://')||!p.claim?.trim()||!p.owner?.trim()||!p.reason?.trim()||!['Accepted','Rejected','Under review'].includes(p.disposition))return 'HTTPS source, claim, owner, review state and reason are required.';
  }else if(kind==='validation'){
    if(!/^\d{2}$/.test(p.id)||!['PASS','FAIL','NOT EXECUTED'].includes(p.status))return 'Invalid acceptance result.';
    if(p.status!=='NOT EXECUTED'&&(!p.observed?.trim()||!p.evidence?.trim()||!p.date||!p.tester))return 'Observed value, evidence, date and tester are required.';
  }else return 'Unknown record type.';
  return '';
}
