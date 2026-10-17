import {data} from '@/lib/model';
export async function POST(request:Request){
  const {url}=await request.json().catch(()=>({url:''}));const allowed=new Set(data.sources.flatMap((s:any)=>s.links.map((l:any)=>l.url)));
  if(typeof url!=='string'||!allowed.has(url))return Response.json({error:'Only registered official sources can be checked in-app.'},{status:400});
  const at=new Date().toISOString();try{const result=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'User-Agent':'NovaDrive-Continuity-Review/3'}});
    return Response.json({url,checkedAt:at,access:result.ok?'Accessible':'Unavailable',note:result.ok?'Access confirmed; inspect the source before accepting its claim.':'HTTP '+result.status},{status:result.ok?200:502});
  }catch(e){return Response.json({url,checkedAt:at,access:'Unavailable',note:e instanceof Error?e.message:'Source unavailable'},{status:502})}
}
