'use client';
import {confirmed,score,interval,one,data,entity} from '@/lib/model';

const iconPaths:Record<string,React.ReactNode>={
  Overview:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  Network:<><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 11l10-5M7 13l10 5"/></>,
  Risk:<><path d="M4 20V11M9 20V6M14 20v-9M19 20V4"/><path d="M2 20h20"/></>,
  Alerts:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  Alternatives:<><path d="M4 5h6l3 4h7M4 19h6l3-4h7"/><path d="m17 6 3 3-3 3M17 12l3 3-3 3"/></>,
  Actions:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  Evidence:<><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h4M9 13h6M9 17h6"/></>,
  Validation:<><path d="M5 12l4 4L19 6"/><circle cx="12" cy="12" r="10"/></>,
  Export:<><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v4h16v-4"/></>,
  Search:<><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  Shield:<><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></>
};
export function Icon({name,size=18}:{name:string,size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]||iconPaths.Overview}</svg>}

export function ScoreRibbon(){
  const names=['Jade','IonPeak','Cobalt','Meridian','Delta','Umber'];
  return <div className="score-ribbon" aria-label="P3 base model reference scores"><div className="score-ribbon-label"><strong>P3 · DOWNSTREAM PATH EXPOSURE</strong><small>Base screening index · action floors apply</small></div><div className="score-ribbon-values">{names.map(name=>{const e=confirmed.find((x:any)=>x.short===name);if(!e)return null;const s=score(e);return <span className="score-ribbon-item" key={name}><b>{name}</b><strong>{interval(s.P)}</strong>{name==='Meridian'&&<small>C {interval(s.C)}</small>}</span>})}</div></div>;
}

export function IndicatorBreakdown({supplier}:{supplier:any}){
  const i=supplier.indicators;
  const entries:[string,string,boolean][]=[
    ['Current ratio',i.cr==null?'Missing':i.cr.toFixed(2),false],
    ['Net debt / EBITDA',i.debt==null?'Missing':i.debt.toFixed(2),false],
    ['On-time shipments',one(i.timeliness)+'%',false],
    ['Change',`${i.change>0?'+':''}${one(i.change)} pp`,false],
    ['Hazard index',String(i.hazard),false],
    ['Logistics index',String(i.logistics),false],
    ['Assurance gap',i.assurance==null?'Missing':String(i.assurance),true],
    ['Infrastructure',i.infrastructure==null?'Missing':String(i.infrastructure),true]
  ];
  return <section className="raw-indicators"><h3>Raw indicator register</h3><p>Case inputs used for condition; assurance gap and infrastructure remain visible but unscored.</p><div className="indicator-grid">{entries.map(([label,value,unscored])=><div key={label}><span>{label}{unscored&&<em>UNSCORED</em>}</span><strong>{value}</strong></div>)}</div></section>;
}

export function NetworkLayers({overlays,open}:{overlays:{ownership:boolean;provisional:boolean;hypothesis:boolean};open:(v:{type:string;id:string})=>void}){
  const ownership=data.links.filter((l:any)=>l.type==='Ownership');
  const provisional=data.links.find((l:any)=>l.status==='Provisional');
  return <section className="network-layers"><div className="network-layers-head"><div><h2>Relationship status & site identity</h2><p>Only confirmed supply edges count toward the 29 production links.</p></div><div className="line-legend"><span className="line-solid">Confirmed supply</span><span className="line-dashed">Provisional</span><span className="line-dotted">Ownership</span></div></div>
    <div className="site-role-grid"><button onClick={()=>open({type:'entity',id:'ORG-453'})}><small>PRODUCTION · INCLUDED</small><strong>Jade · SITE-081</strong><span>Qualified substrate factory in Z01</span></button><button onClick={()=>open({type:'evidence',id:'DOC-076'})}><small>HEADQUARTERS · EXCLUDED</small><strong>Jade Holdings</strong><span>Administrative parent location · DOC-076</span></button><button onClick={()=>open({type:'evidence',id:'DOC-077'})}><small>PILOT · EXCLUDED</small><strong>SITE-900</strong><span>Unqualified pilot / broker record · DOC-077</span></button></div>
    {(overlays.ownership||overlays.provisional||overlays.hypothesis)&&<div className="layer-rows">
      {overlays.provisional&&provisional&&<button className="layer-row provisional" onClick={()=>open({type:'evidence',id:provisional.evidence[0]})}><strong>{entity(provisional.source)?.short} → {entity(provisional.target)?.short}</strong><span>Process gases · receiving line unresolved · {provisional.evidence[0]}</span><em>PROVISIONAL</em></button>}
      {overlays.ownership&&ownership.map((l:any)=><button className="layer-row ownership" key={l.source+'-'+l.target} onClick={()=>open({type:'evidence',id:l.evidence[0]})}><strong>{entity(l.source)?.short} → {entity(l.target)?.short}</strong><span>Parent control · {l.evidence[0]} · outside supply count</span><em>OWNERSHIP</em></button>)}
      {overlays.hypothesis&&<button className="layer-row hypothesis" onClick={()=>open({type:'evidence',id:'DOC-085'})}><strong>Solace → Grove</strong><span>Sample evaluation only · no serial-production award · DOC-085</span><em>HYPOTHESIS</em></button>}
    </div>}
  </section>;
}

export function PortfolioVisual({filtered,open,navigate}:{filtered:any[],open:(v:any)=>void,navigate:(v:string)=>void}){
  const ranked=filtered.filter(e=>!score(e).missing).sort((a,b)=>score(b).P[0]-score(a).P[0]).slice(0,5);
  const tiers=[1,2,3].map(t=>filtered.filter(e=>e.tier===t).length);
  const total=filtered.length;
  const complete=filtered.filter(e=>!score(e).missing).length;
  const circumference=2*Math.PI*58;
  const colours=['#22654b','#a8ae77','#c78b4f'];
  let offset=0;
  const arcs=tiers.map((count,i)=>{const length=total?circumference*count/total:0;const at=offset;offset+=length;return <circle key={i} cx="80" cy="80" r="58" fill="none" stroke={colours[i]} strokeWidth="17" strokeDasharray={`${Math.max(0,length-3)} ${circumference}`} strokeDashoffset={-at} transform="rotate(-90 80 80)"/>});
  return <div className="analytics-grid">
    <section className="analytics-card priority-chart"><div className="analytics-head"><div><div className="card-kicker">PORTFOLIO SIGNAL</div><h2>Highest P3 priorities</h2><p>Current selection · complete-data · base model</p></div><button className="quiet-action" onClick={()=>navigate('Risk')}>Full scorecard <span aria-hidden="true">↗</span></button></div>
      <div className="score-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      <div className="score-list">{ranked.map(e=>{const s=score(e);return <button className="score-row" key={e.id} onClick={()=>open({type:'entity',id:e.id})}><span className="score-name"><strong>{e.short}</strong><small>Tier {e.tier}</small></span><span className="score-track"><span className="score-fill" style={{width:`${s.P[0]}%`}}/></span><strong className="score-value">{interval(s.P)}</strong></button>})}{ranked.length===0&&<p className="chart-empty">No complete-data manufacturers match these filters.</p>}</div>
      <div className="chart-footer"><span><i className="legend-dot"/>P3 screening index</span><span>Click a row to inspect the underlying evidence</span></div>
    </section>
    <section className="analytics-card tier-chart"><div className="analytics-head"><div><div className="card-kicker">NETWORK COMPOSITION</div><h2>Manufacturer tiers</h2><p>Current selection · confirmed manufacturers</p></div><button className="quiet-action" onClick={()=>navigate('Network')}>Explore <span aria-hidden="true">↗</span></button></div>
      <div className="tier-chart-body"><div className="tier-donut"><svg viewBox="0 0 160 160" role="img" aria-label={`Tier 1 ${tiers[0]}, Tier 2 ${tiers[1]}, Tier 3 ${tiers[2]}`}><circle cx="80" cy="80" r="58" fill="none" stroke="#e9ece5" strokeWidth="17"/>{arcs}</svg><div className="tier-center"><strong>{total}</strong><small>confirmed</small></div></div><div className="tier-legend">{tiers.map((count,i)=><div key={i}><span className="tier-label"><i style={{background:colours[i]}}/>Tier {i+1}</span><strong>{count}</strong></div>)}</div></div>
      <div className="coverage-mini"><div><span>Financial inputs in selection</span><strong>{complete} / {total}</strong></div><div className="coverage-rail" role="img" aria-label={`${complete} of ${total} manufacturers have complete financial inputs`}><span style={{width:`${total?complete/total*100:0}%`}}/></div><small>{total-complete} manufacturer{total-complete===1?'':'s'} remain as score intervals</small></div>
      <div className="chart-footer"><span>Full network · 29 supply links</span><span>10 allocations tracked separately</span></div>
    </section>
  </div>;
}
