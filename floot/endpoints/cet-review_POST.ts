import { cetReply } from '../helpers/cetReply';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../helpers/getSetServerSession';
import { cetReview, ReviewError,type ReviewPaper,type ReviewAttempt } from '../helpers/cetReview';
import { schema } from './cet-review_POST.schema';
export async function handle(request:Request){
 try{
  const {user}=await getServerUserSession(request);
  if(user.role!=='admin')return cetReply({error:'仅管理员可使用资料审核样本。'},{status:403});
  if(request.headers.get('origin')&&new URL(request.headers.get('origin')!).origin!==new URL(request.url).origin)return cetReply({error:'请求来源不符。'},{status:403});
  if(Number(request.headers.get('content-length')||0)>50000)return cetReply({error:'请求内容过大。'},{status:413});
  const input=schema.parse(await request.json());
  const result=await db.transaction().execute(async tx=>{
   const row=await tx.selectFrom('cetReviewPapers').select('payload').where('id','=','cet4-2023-06-1').executeTakeFirstOrThrow();
   await tx.insertInto('cetReviewAttempts').values({userId:user.id,paperId:'cet4-2023-06-1',revision:0}).onConflict(c=>c.columns(['userId','paperId']).doNothing()).execute();
   const prior=await tx.selectFrom('cetReviewAttempts').selectAll().where('userId','=',user.id).where('paperId','=','cet4-2023-06-1').forUpdate().executeTakeFirstOrThrow();
   const attempt:ReviewAttempt={revision:prior.revision,answers:prior.answers as Record<string,string>,texts:prior.texts as Record<string,string>,submittedGroups:prior.submittedGroups as string[]};
   const next=cetReview.apply(row.payload as unknown as ReviewPaper,attempt,input);
   await tx.updateTable('cetReviewAttempts').set({revision:next.revision,answers:next.answers,texts:next.texts,submittedGroups:next.submittedGroups,updatedAt:new Date()}).where('userId','=',user.id).where('paperId','=','cet4-2023-06-1').execute();return {revision:next.revision};
  });
  return cetReply(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){const validation=error instanceof Error&&error.name==='ZodError';return cetReply({error:error instanceof ReviewError?error.message:error instanceof NotAuthenticatedError?'请先登录管理员账号。':validation?'提交的内容格式不正确。':'保存失败，草稿仍留在当前页面，请重试。'},{status:error instanceof ReviewError?error.status:error instanceof NotAuthenticatedError?401:validation?400:500,headers:{'Cache-Control':'no-store'}});}
}
