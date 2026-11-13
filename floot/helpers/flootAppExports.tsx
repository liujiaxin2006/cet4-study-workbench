import {adminDashboardData} from './adminDashboardData';
import type {AdminDashboard} from '../endpoints/admin-dashboard_GET.schema';
import type { AppCallContext } from '@floot/apps';
import { upload,getInfo } from '@floot/storage';
import { z } from 'zod';
import { db } from './db';
import type { ReviewPaper } from './cetReview';
type SourceUploadInput={sourceIds:string[]};
type SourceUploadOutput={files:{id:string;filename:string;exists:boolean;presignedUrl?:string;headers?:Record<string,string>;bytes:number}[]};
/** Prepare private uploads for the three approved sample assets; never exposes files to ordinary users. */
export async function prepareCetReviewUploads(input:SourceUploadInput,ctx:AppCallContext):Promise<SourceUploadOutput>{
 if(!ctx.caller.sameOwner)throw new Error('Only the project owner can prepare corpus uploads.');
 const parsed=z.object({sourceIds:z.array(z.enum(['sample-paper','sample-answer','sample-audio'])).min(1).max(3)}).strict().parse(input);
 const row=await db.selectFrom('cetReviewPapers').select('payload').where('id','=','cet4-2023-06-1').executeTakeFirstOrThrow();
 const sources=(row.payload as unknown as ReviewPaper).sources;
 const files:SourceUploadOutput['files']=[];
 for(const id of new Set(parsed.sourceIds)){
  const source=sources.find(s=>s.id===id);if(!source)throw new Error('Unknown sample source.');
  const filename='cet4/review/'+source.sha256+(source.contentType==='audio/mpeg'?'.mp3':'.pdf');
  const info=await getInfo({visibility:'private',filename});
  if(info.ok&&info.exists&&info.sizeBytes===source.bytes){files.push({id,filename,exists:true,bytes:source.bytes});continue;}
  const result=await upload({visibility:'private',filename,contentType:source.contentType,sizeBytes:source.bytes,ifAbsent:true});
  if(!result.ok)throw new Error(result.error.message);
  files.push({id,filename,exists:false,presignedUrl:result.presignedUrl,headers:result.headers,bytes:source.bytes});
 }
 return {files};
}

/** Read operating statistics for the verified project owner, for diagnosis without changing app accounts. */
export async function readOwnerDashboard(input:{days:7|30;q?:string;page?:number},ctx:AppCallContext):Promise<AdminDashboard>{
 if(!ctx.caller.sameOwner)throw new Error('Only the project owner can inspect operating statistics.');
 return adminDashboardData({days:input.days,q:input.q||'',page:input.page||1});
}
