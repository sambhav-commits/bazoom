import {authorized,configured} from '@/lib/auth';
import Dashboard from '@/components/dashboard';
export const dynamic='force-dynamic';
export default async function Page(){
  if(process.env.NODE_ENV==='production'&&!configured())return <main className="setup"><div className="brand-mark">N</div><h1>Hosting setup required</h1><p>Set ACCESS_PASSWORD, SESSION_SECRET and DATABASE_URL in the Vercel project, then redeploy this build.</p></main>;
  return <Dashboard canEdit={await authorized()}/>;
}
