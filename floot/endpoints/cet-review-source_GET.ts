import { cetReply } from '../helpers/cetReply';
import { getUrl,getInfo } from '@floot/storage';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../helpers/getSetServerSession';
import type { ReviewPaper } from '../helpers/cetReview';
export async function handle(request:Request){try{
 const {user}=await getServerUserSession(request);if(user.role!=='admin')return cetReply({error:'仅管理员可以访问原始资料。'},{status:403});
 const id=new URL(request.url).searchParams.get('id');
 const row=await db.selectFrom('cetReviewPapers').select('payload').where('id','=','cet4-2023-06-1').executeTakeFirstOrThrow();
 const source=(row.payload as unknown as ReviewPaper).sources.find(s=>s.id===id);
 if(!source)return cetReply({error:'资料不存在。'},{status:404});
 const filename='cet4/review/'+source.sha256+(source.contentType==='audio/mpeg'?'.mp3':'.pdf');
 const info=await getInfo({visibility:'private',filename});
 if(!info.ok||!info.exists||info.sizeBytes!==source.bytes)return cetReply({error:'原始文件尚未传完或校验未通过。'},{status:503});
 const result=await getUrl({visibility:'private',filename,expiresInSeconds:3600});if(!result.ok)throw new Error(result.error.message);
 return cetReply({url:result.url},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return cetReply({error:e instanceof NotAuthenticatedError?'请先登录。':'读取私有资料失败。'},{status:e instanceof NotAuthenticatedError?401:500,headers:{'Cache-Control':'no-store'}});}}
