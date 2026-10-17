import sections from '@/lib/sections.json';
export async function GET(request:Request){const id=new URL(request.url).searchParams.get('id')||'';const section=(sections as Record<string,{title:string,body:string}>)[id];return section?Response.json({id,...section}):Response.json({error:'Unknown section.'},{status:404})}
