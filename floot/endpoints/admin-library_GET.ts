import {db} from '../helpers/db';
import {requireAdmin,AdminAccessError} from '../helpers/requireAdmin';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {cetReply} from '../helpers/cetReply';
import {wordBank} from '../helpers/wordBank';
import {originalTraining} from '../helpers/originalTraining';
import type {ReviewPaper} from '../helpers/cetReview';
export async function handle(request:Request){try{await requireAdmin(request);const [imports,rows]=await Promise.all([db.selectFrom('cetCorpusImports').select('inventory').where('id','=','desktop-cet4-2017-2026').executeTakeFirst(),db.selectFrom('cetReviewPapers').select('payload').orderBy('id','desc').limit(50).execute()]);const raw=(imports?.inventory||{}) as any;const papers=rows.map(r=>r.payload as unknown as ReviewPaper);const sources=papers.flatMap(p=>p.sources);
 return cetReply({wordCount:wordBank.length,original:originalTraining,papers,files:(raw.files||[]).map((f:any)=>({id:f.id,path:f.path,exam:f.exam,extension:f.extension,bytes:f.bytes,issues:f.issues||[],category:f.category,pages:f.pages,sourceId:sources.find(s=>s.sha256===f.sha256)?.id||null})),sessions:raw.sessions||[],fileCount:raw.fileCount||0,totalBytes:raw.totalBytes||0,lowTextFiles:(raw.files||[]).filter((f:any)=>f.lowTextPages?.length).length,duplicates:(raw.exactDuplicateGroups||[]).length,exactDuplicateGroups:raw.exactDuplicateGroups||[]});
 }catch(e){return cetReply({error:e instanceof AdminAccessError?e.message:e instanceof NotAuthenticatedError?'请先登录。':'读取题库失败。'},{status:e instanceof AdminAccessError?403:e instanceof NotAuthenticatedError?401:500});}}
