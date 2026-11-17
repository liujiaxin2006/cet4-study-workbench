import {sql} from 'kysely';
import {createHash,randomBytes,randomUUID} from 'crypto';
import {db} from './db';
import {generatePasswordHash} from './generatePasswordHash';
export class RecoveryError extends Error {constructor(message:string,public status=400){super(message);}}
export const recoveryDigest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function recoveryOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new RecoveryError('请求来源不符。',403);}
export async function recoveryBody(request:Request){recoveryOrigin(request);const raw=await request.text();if(raw.length>5000)throw new RecoveryError('提交内容过长。',413);try{return JSON.parse(raw);}catch{throw new RecoveryError('提交格式不正确。');}}
function ipBucket(request:Request){const raw=request.headers.get('x-floot-client-ip')||'unknown';if(!raw.includes(':'))return raw;const [head,tail='']=raw.split('::');const left=head?head.split(':'):[],right=tail?tail.split(':'):[];const groups=raw.includes('::')?[...left,...Array(Math.max(0,8-left.length-right.length)).fill('0'),...right]:left;return groups.slice(0,4).join(':');}
export async function requestRecovery(email:string,request:Request){
 return db.transaction().execute(async tx=>{
  const hour=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();
  for(const [bucket,limit] of [['recovery:global',200],['recovery:ip:'+recoveryDigest(ipBucket(request)),30],['recovery:email:'+recoveryDigest(email),5]] as const){
   const result=await sql<{attempts:number}>`INSERT INTO auth_action_limits(bucket,window_start) VALUES(${bucket},${hour}::timestamptz) ON CONFLICT(bucket,window_start) DO UPDATE SET attempts=auth_action_limits.attempts+1 RETURNING attempts`.execute(tx);
   if(result.rows[0].attempts>limit)return {limited:true};
  }
  await sql`SELECT pg_advisory_xact_lock(hashtextextended(${'recovery-request:'+email},0))`.execute(tx);
  const recent=await sql`SELECT id FROM password_recovery_requests WHERE email=${email} AND created_at>now()-interval '1 minute' LIMIT 1`.execute(tx);if(recent.rows.length)return {limited:false};
  const user=await sql<{id:number}>`SELECT id FROM users WHERE lower(btrim(email))=${email} LIMIT 1`.execute(tx);
  await sql`INSERT INTO password_recovery_requests(id,email,user_id) VALUES(${randomUUID()}::uuid,${email},${user.rows[0]?.id||null})`.execute(tx);
  await sql`DELETE FROM auth_action_limits WHERE window_start<now()-interval '2 days'`.execute(tx);
  return {limited:false};
 });
}
export async function issueRecovery(id:string,adminId:number){
 return db.transaction().execute(async tx=>{
  const request=await sql<{email:string;userId:number|null;status:string}>`SELECT email,user_id,status FROM password_recovery_requests WHERE id=${id}::uuid`.execute(tx);const item=request.rows[0];if(!item||!item.userId||['completed','declined'].includes(item.status))throw new RecoveryError('这条申请无法生成恢复链接。');
  await sql`SELECT pg_advisory_xact_lock(hashtextextended(${item.email},0))`.execute(tx);
  const locked=await sql<{userId:number;role:string;email:string;status:string}>`SELECT r.user_id,u.role,u.email,r.status FROM password_recovery_requests r JOIN users u ON u.id=r.user_id WHERE r.id=${id}::uuid FOR UPDATE OF r,u`.execute(tx);const target=locked.rows[0];if(!target||['completed','declined'].includes(target.status))throw new RecoveryError('申请状态已改变，请刷新。',409);
  if(target.role==='admin'&&target.userId!==adminId)throw new RecoveryError('其他管理员账号需要由项目所有者处理。',403);
  if(target.email.trim().toLowerCase()!==item.email)throw new RecoveryError('账号邮箱已变更，请重新核验。',409);
  const token=randomBytes(32).toString('hex'),expiresAt=new Date(Date.now()+30*60000);
  await sql`UPDATE password_recovery_tokens SET used_at=now() WHERE user_id=${target.userId} AND used_at IS NULL`.execute(tx);
  await sql`INSERT INTO password_recovery_tokens(token_hash,user_id,request_id,created_by,expires_at) VALUES(${recoveryDigest(token)},${target.userId},${id}::uuid,${adminId},${expiresAt.toISOString()}::timestamptz)`.execute(tx);
  await sql`UPDATE password_recovery_requests SET status='issued',handled_by=${adminId},handled_at=now() WHERE id=${id}::uuid`.execute(tx);
  return {url:'https://cet4-study-jiaxi.floot.app/forgot-password#token='+token,expiresAt:expiresAt.toISOString()};
 });
}
export async function finishRecovery(token:string,password:string){
 const digest=recoveryDigest(token);const lookup=await sql<{email:string;userId:number}>`SELECT u.email,u.id user_id FROM password_recovery_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=${digest} AND t.used_at IS NULL AND t.expires_at>now()`.execute(db);const user=lookup.rows[0];if(!user)throw new RecoveryError('恢复链接已失效，请重新申请。');
 const passwordHash=await generatePasswordHash(password);
 await db.transaction().execute(async tx=>{
  await sql`SELECT pg_advisory_xact_lock(hashtextextended(${user.email.trim().toLowerCase()},0))`.execute(tx);
  await sql`SELECT id FROM users WHERE id=${user.userId} FOR UPDATE`.execute(tx);
  const used=await sql`UPDATE password_recovery_tokens SET used_at=now() WHERE token_hash=${digest} AND used_at IS NULL AND expires_at>now() RETURNING user_id`.execute(tx);if(!used.rows.length)throw new RecoveryError('恢复链接已失效，请重新申请。');
  const changed=await tx.updateTable('userPasswords').set({passwordHash}).where('userId','=',user.userId).returning('id').execute();if(!changed.length)throw new RecoveryError('此账号未设置密码，请联系管理员。');
  await tx.deleteFrom('sessions').where('userId','=',user.userId).execute();
  await tx.deleteFrom('loginAttempts').where('email','=',user.email.trim().toLowerCase()).where('success','=',false).execute();
  await sql`UPDATE password_recovery_tokens SET used_at=coalesce(used_at,now()) WHERE user_id=${user.userId}`.execute(tx);
  await sql`UPDATE password_recovery_requests SET status='completed',handled_at=now() WHERE user_id=${user.userId} AND status IN ('pending','issued')`.execute(tx);
 });
}
