import {neon} from '@neondatabase/serverless';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
type Row={id:string;kind:string;payload:string;revision:number;updated_at:string};
let local:DatabaseSync|undefined;
let postgresInit:Promise<void>|undefined;
function localDb(){
  if(process.env.NODE_ENV==='production')throw new Error('DATABASE_URL is required in production.');
  if(!local){const dir=join(process.cwd(),'.data');mkdirSync(dir,{recursive:true});local=new DatabaseSync(join(dir,'workspace.sqlite'));
    local.exec('CREATE TABLE IF NOT EXISTS workspace_records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL)');
    local.exec('CREATE TABLE IF NOT EXISTS workspace_audit (id TEXT PRIMARY KEY, record_id TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL)');
    local.exec('CREATE INDEX IF NOT EXISTS workspace_audit_record ON workspace_audit(record_id)');}
  return local;
}
function pg(){const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required in production.');return neon(url)}
async function initPg(){if(!postgresInit){const sql=pg();postgresInit=(async()=>{
  await sql`CREATE TABLE IF NOT EXISTS workspace_records (id text PRIMARY KEY, kind text NOT NULL, payload text NOT NULL, revision integer NOT NULL, updated_at timestamptz NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS workspace_audit (id text PRIMARY KEY, record_id text NOT NULL, kind text NOT NULL, payload text NOT NULL, actor text NOT NULL, created_at timestamptz NOT NULL)`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_audit_record ON workspace_audit(record_id)`;
})().catch(e=>{postgresInit=undefined;throw e})}return postgresInit}
export async function readState(){
  let records:Row[],history:any[];
  if(process.env.DATABASE_URL){await initPg();const sql=pg();const found=await Promise.all([sql`SELECT * FROM workspace_records ORDER BY updated_at DESC`,sql`SELECT * FROM workspace_audit ORDER BY created_at DESC LIMIT 200`]);records=found[0] as Row[];history=found[1];}
  else{const db=localDb();records=db.prepare('SELECT * FROM workspace_records ORDER BY updated_at DESC').all() as unknown as Row[];history=db.prepare('SELECT * FROM workspace_audit ORDER BY created_at DESC LIMIT 200').all()}
  return {records:records.map(r=>({...JSON.parse(r.payload),kind:r.kind,revision:r.revision,updatedAt:r.updated_at})),history:history.map(h=>({...h,payload:JSON.parse(h.payload)}))};
}
export async function saveRecord(kind:string,payload:any,actor:string){
  const key=kind+':'+payload.id,revision=Number(payload.revision)||0,now=new Date().toISOString(),auditId=crypto.randomUUID();
  const clean={...payload};delete clean.kind;delete clean.revision;delete clean.updatedAt;const json=JSON.stringify(clean);
  let next:number;
  if(process.env.DATABASE_URL){
    await initPg();const sql=pg();const results=await sql.query(`WITH saved AS (
      INSERT INTO workspace_records (id,kind,payload,revision,updated_at)
      SELECT $1,$2,$3,1,$4 WHERE $5=0 OR EXISTS (SELECT 1 FROM workspace_records WHERE id=$1)
      ON CONFLICT (id) DO UPDATE SET payload=EXCLUDED.payload,revision=workspace_records.revision+1,updated_at=EXCLUDED.updated_at
      WHERE workspace_records.revision=$5 RETURNING revision
    ), logged AS (
      INSERT INTO workspace_audit (id,record_id,kind,payload,actor,created_at)
      SELECT $6,$1,$2,$3,$7,$4 FROM saved RETURNING id
    ) SELECT revision FROM saved`,[key,kind,json,now,revision,auditId,actor]);
    if(!results.length)throw new Error('Record changed elsewhere. Refresh before saving.');next=Number(results[0].revision);
  }else{
    const db=localDb();db.exec('BEGIN IMMEDIATE');try{
      const current=db.prepare('SELECT revision FROM workspace_records WHERE id=?').get(key) as {revision:number}|undefined;
      if((current?.revision||0)!==revision)throw new Error('Record changed elsewhere. Refresh before saving.');
      next=revision+1;
      db.prepare('INSERT INTO workspace_records(id,kind,payload,revision,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at').run(key,kind,json,next,now);
      db.prepare('INSERT INTO workspace_audit(id,record_id,kind,payload,actor,created_at) VALUES(?,?,?,?,?,?)').run(auditId,key,kind,json,actor,now);
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e}
  }
  return {...clean,kind,revision:next,updatedAt:now};
}
