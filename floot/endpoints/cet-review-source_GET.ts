import {sql} from 'kysely';
import { cetReply } from '../helpers/cetReply';
import { getUrl,getInfo } from '@floot/storage';
import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../helpers/getSetServerSession';
import type { ReviewPaper } from '../helpers/cetReview';
export async function handle(request:Request){try{
 const {user}=await getServerUserSession(request);if(user.role!=='admin')return cetReply({error:'仅管理员可以访问原始资料。'},{status:403});
 const id=new URL(request.url).searchParams.get('id');
 if(!id||!/^[a-z0-9-]{1,100}$/.test(id))return cetReply({error:'资料不存在。'},{status:404});
 const result=await sql<{source:any}>`SELECT s.value AS source FROM cet_review_papers p CROSS JOIN LATERAL jsonb_array_elements(p.payload->'sources') s WHERE s.value->>'id'=${id} LIMIT 1`.execute(db);
 const source=result.rows[0]?.source;
 if(!source)return cetReply({error:'资料不存在。'},{status:404});
 const extension=source.contentType==='audio/mpeg'?'.mp3':source.contentType==='text/markdown'?'.md':'.pdf';
 const filename='cet4/review/'+source.sha256+extension;
 const info=await getInfo({visibility:'private',filename});
 if(!info.ok||!info.exists||info.sizeBytes!==source.bytes)return cetReply({error:'原始文件尚未传完或校验未通过。'},{status:503});
 const link=await getUrl({visibility:'private',filename,expiresInSeconds:3600});if(!link.ok)throw new Error(link.error.message);
 return cetReply({url:link.url},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return cetReply({error:e instanceof NotAuthenticatedError?'请先登录。':'读取私有资料失败。'},{status:e instanceof NotAuthenticatedError?401:500,headers:{'Cache-Control':'no-store'}});}}
