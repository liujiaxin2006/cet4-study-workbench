import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {usageAccounting} from '../helpers/usageAccounting';
import {cetReply} from '../helpers/cetReply';
import {schema} from './study-usage_POST.schema';
export async function handle(request:Request){try{
 const {user}=await getServerUserSession(request);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return cetReply({error:'请求来源不符。'},{status:403});
 if(Number(request.headers.get('content-length')||0)>1500)return cetReply({error:'内容过大。'},{status:413});
 const input=schema.parse(await request.json());
 const result=await db.transaction().execute(async tx=>{
  const now=new Date();
  await tx.insertInto('studyUsageClocks').values({userId:user.id,creditedAt:now}).onConflict(c=>c.column('userId').doNothing()).execute();
  const clock=await tx.selectFrom('studyUsageClocks').selectAll().where('userId','=',user.id).forUpdate().executeTakeFirstOrThrow();
  const prior=await tx.selectFrom('studyUsageSessions').selectAll().where('id','=',input.id).executeTakeFirst();
  if(prior&&(prior.userId!==user.id||prior.module!==input.module))return {accepted:false};
  if(!prior){if(input.action!=='start'||input.activeSeconds!==0)return {accepted:false};await tx.insertInto('studyUsageSessions').values({id:input.id,userId:user.id,module:input.module,startedAt:now,lastSeenAt:now,sequence:input.sequence}).execute();return {accepted:true};}
  if(input.action==='start')return {accepted:true};
  if(input.activeSeconds<prior.reportedSeconds)return {accepted:false};
  const credit=usageAccounting.credit({sequence:prior.sequence,reportedSeconds:prior.reportedSeconds,lastSeenAt:new Date(prior.lastSeenAt).getTime()},input,now.getTime(),new Date(clock.creditedAt).getTime());
  if(credit.duplicate)return {accepted:true};
  await tx.updateTable('studyUsageSessions').set({sequence:input.sequence,reportedSeconds:input.activeSeconds,lastSeenAt:now,activeSeconds:prior.activeSeconds+credit.seconds}).where('id','=',input.id).execute();
  if(credit.seconds){await tx.insertInto('studyUsageTicks').values({sessionId:input.id,sequence:input.sequence,userId:user.id,module:input.module,occurredAt:now,activeSeconds:credit.seconds}).execute();await tx.updateTable('studyUsageClocks').set({creditedAt:now}).where('userId','=',user.id).execute();}
  return {accepted:true};
 });return cetReply(result);
 }catch(e){const invalid=e instanceof Error&&e.name==='ZodError';return cetReply({error:'使用记录未保存。'},{status:e instanceof NotAuthenticatedError?401:invalid?400:500});}}
