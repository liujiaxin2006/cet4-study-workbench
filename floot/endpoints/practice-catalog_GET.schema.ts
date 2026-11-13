import superjson from 'superjson';
export type CatalogGroup={id:string;kind:string;title:string;questions:number;ready:boolean;issues:string[];submitted:boolean;lastPracticedAt?:string;firstScore?:{correct:number;total:number};reviewDueAt?:string;reviewStage?:number};
export type CatalogPaper={id:string;title:string;exam:string;status:string;groups:CatalogGroup[];issues:string[]};
export type PracticeCatalog={papers:CatalogPaper[];types:{kind:string;name:string;weight:number;count:number;groups:number;questions:number;firstCorrect:number;firstAnswered:number;due:number}[];summary:{papers:number;readyPapers:number;readyGroups:number;readyQuestions:number;due:number};generatedAt:string};
export async function practiceRequest<T>(path:string,init?:RequestInit):Promise<T>{const response=await fetch('/_api/'+path,{credentials:'same-origin',cache:'no-store',...init});const data=superjson.parse<any>(await response.text());if(!response.ok)throw Object.assign(new Error(data.error||'题库暂时无法读取，请重试。'),{status:response.status});return data;}
export const getPracticeCatalog=()=>practiceRequest<PracticeCatalog>('practice-catalog');
