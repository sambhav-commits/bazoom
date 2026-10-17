import {authorized} from '@/lib/auth';
import {readState,saveRecord} from '@/lib/store';
import {validateRecord} from '@/lib/model';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await readState(),{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({error:'Saved workspace unavailable. Check database configuration.'},{status:503})}}
export async function POST(request:Request){
  if(!await authorized())return Response.json({error:'Sign in to save changes.'},{status:401});
  if(request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Cross-site saves are disabled.'},{status:403});
  const raw=await request.text();if(raw.length>60000)return Response.json({error:'Record is too large.'},{status:413});
  try{const {kind,payload}=JSON.parse(raw);const error=validateRecord(kind,payload);if(error)return Response.json({error},{status:400});const value=await saveRecord(kind,payload,'Workspace reviewer');return Response.json(value)}
  catch(e){console.error(e);const message=e instanceof Error?e.message:'Save failed.';return Response.json({error:message},{status:message.includes('changed elsewhere')?409:503})}
}
