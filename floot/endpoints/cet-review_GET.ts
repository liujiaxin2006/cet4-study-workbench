import { cetReply } from '../helpers/cetReply';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../helpers/getSetServerSession';
import { cetReview,type ReviewPaper,type ReviewAttempt } from '../helpers/cetReview';
export async function handle(request:Request){
  try{
    const {user}=await getServerUserSession(request);
    if(user.role!=='admin')return cetReply({error:'资料整理样本仅向管理员开放。'},{status:403});
    const [paperRow,importRow,attemptRow]=await Promise.all([
      db.selectFrom('cetReviewPapers').select('payload').where('id','=','cet4-2023-06-1').executeTakeFirst(),
      db.selectFrom('cetCorpusImports').select('inventory').where('id','=','desktop-cet4-2017-2026').executeTakeFirst(),
      db.selectFrom('cetReviewAttempts').selectAll().where('userId','=',user.id).where('paperId','=','cet4-2023-06-1').executeTakeFirst()]);
    if(!paperRow||!importRow)return cetReply({error:'资料还没有完成导入。'},{status:503});
    const paper=paperRow.payload as unknown as ReviewPaper;
    const raw=importRow.inventory as any;
    const attempt:ReviewAttempt=attemptRow?{revision:attemptRow.revision,answers:attemptRow.answers as Record<string,string>,texts:attemptRow.texts as Record<string,string>,submittedGroups:attemptRow.submittedGroups as string[]}:cetReview.empty();
    return cetReply({paper:cetReview.publicPaper(paper,attempt),attempt,inventory:{fileCount:raw.fileCount,totalBytes:raw.totalBytes,extensions:raw.extensions,exactDuplicateGroups:raw.exactDuplicateGroups,sameNormalizedTextGroups:raw.sameNormalizedTextGroups,sessions:raw.sessions,lowTextFiles:raw.files.filter((f:any)=>f.lowTextPages?.length).length,legacyWordFiles:raw.files.filter((f:any)=>f.extension==='.doc').length}},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return cetReply({error:error instanceof NotAuthenticatedError?'请先登录管理员账号。':'读取审核资料失败。'},{status:error instanceof NotAuthenticatedError?401:500,headers:{'Cache-Control':'no-store'}});}
}
