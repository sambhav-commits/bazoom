import {createHmac,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
const cookieName='novadrive_session';
function signature(){const password=process.env.ACCESS_PASSWORD,secret=process.env.SESSION_SECRET;if(!password||!secret)return '';return createHmac('sha256',secret).update('novadrive-session-v3:'+password).digest('hex')}
export function configured(){return Boolean(process.env.ACCESS_PASSWORD&&process.env.SESSION_SECRET&&process.env.DATABASE_URL)}
export async function authorized(){
  if(process.env.NODE_ENV!=='production'&&!process.env.ACCESS_PASSWORD)return true;
  const expected=signature(),value=(await cookies()).get(cookieName)?.value||'';
  if(!expected||value.length!==expected.length)return false;
  return timingSafeEqual(Buffer.from(value),Buffer.from(expected));
}
export function sessionValue(){return signature()}
export const sessionCookie=cookieName;
