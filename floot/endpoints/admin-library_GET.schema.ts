import superjson from 'superjson';
import type {ReviewPaper} from '../helpers/cetReview';
import type {originalTraining} from '../helpers/originalTraining';
export type LibraryFile={id:string;path:string;exam:string;extension:string;bytes:number;issues:string[];category:string;pages?:number;sourceId:string|null};
export type AdminLibrary={wordCount:number;original:typeof originalTraining;papers:ReviewPaper[];files:LibraryFile[];sessions:{exam:string;files:number;paperFiles:number;answerFiles:number;audioFiles:number;filesRequiringReview:number}[];fileCount:number;totalBytes:number;lowTextFiles:number;duplicates:number;exactDuplicateGroups:string[][]};
export async function getAdminLibrary():Promise<AdminLibrary>{const r=await fetch('/_api/admin-library',{cache:'no-store'});const d=superjson.parse<any>(await r.text());if(!r.ok)throw new Error(d.error||'读取题库失败。');return d;}
