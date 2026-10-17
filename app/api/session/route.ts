import {NextResponse} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
import {sessionCookie,sessionValue} from '@/lib/auth';
export async function POST(request:Request){
  const expected=process.env.ACCESS_PASSWORD;
  if(!expected||!process.env.SESSION_SECRET||!process.env.DATABASE_URL)return NextResponse.json({error:'Hosting setup is incomplete.'},{status:503});
  const {password}=await request.json().catch(()=>({password:''}));
  const a=createHash('sha256').update(String(password)).digest(),b=createHash('sha256').update(expected).digest();
  if(!timingSafeEqual(a,b))return NextResponse.json({error:'Incorrect access password.'},{status:401});
  const result=NextResponse.json({ok:true});result.cookies.set(sessionCookie,sessionValue(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});return result;
}
