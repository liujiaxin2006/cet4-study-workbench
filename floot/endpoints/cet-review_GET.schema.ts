import superjson from 'superjson';
import type { ReviewPaper,ReviewAttempt } from '../helpers/cetReview';
export type InventorySummary = { fileCount:number; totalBytes:number; extensions:Record<string,number>; exactDuplicateGroups:string[][]; sameNormalizedTextGroups:string[][]; sessions:{exam:string;files:number;paperFiles:number;answerFiles:number;audioFiles:number;filesRequiringReview:number}[]; lowTextFiles:number; legacyWordFiles:number };
export type OutputType = {paper:ReviewPaper;attempt:ReviewAttempt;inventory:InventorySummary};
export async function getCetReview():Promise<OutputType>{
  const response=await fetch('/_api/cet-review',{credentials:'same-origin',cache:'no-store'});
  const data=superjson.parse<any>(await response.text());if(!response.ok)throw new Error(data.error||'读取审核资料失败。');return data;
}
