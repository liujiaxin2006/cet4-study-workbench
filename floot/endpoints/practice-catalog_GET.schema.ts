import superjson from 'superjson';
export type CatalogGroup={id:string;kind:string;title:string;questions:number;ready:boolean;issues:string[];submitted:boolean;inProgress?:boolean;lastSavedAt?:string;lastPracticedAt?:string;firstScore?:{correct:number;total:number};reviewDueAt?:string;reviewStage?:number};
export type CatalogPaper={id:string;title:string;exam:string;status:string;groups:CatalogGroup[];issues:string[]};
export type PracticeCatalog={papers:CatalogPaper[];types:{kind:string;name:string;weight:number;count:number;groups:number;questions:number;firstCorrect:number;firstAnswered:number;due:number}[];summary:{papers:number;readyPapers:number;readyGroups:number;readyQuestions:number;due:number};generatedAt:string};
export async function practiceRequest<T>(path:string,init?:RequestInit):Promise<T>{
 const controller=new AbortController();
 const cancel=()=>controller.abort();
 if(init?.signal?.aborted)cancel();else init?.signal?.addEventListener('abort',cancel,{once:true});
 const deadline=setTimeout(cancel,20000);
 try{
  const response=await fetch('/_api/'+path,{credentials:'same-origin',cache:'no-store',...init,signal:controller.signal});
  const body=await response.text();
  let data:any;
  try{data=superjson.parse(body);}catch{throw Object.assign(new Error('服务暂时无法响应，请稍后重试。'),{status:response.status});}
  if(!response.ok)throw Object.assign(new Error(data.error||'数据暂时无法读取，请重试。'),{status:response.status});
  return data;
 }catch(e){
  if(controller.signal.aborted)throw new Error(init?.signal?.aborted?'请求已取消。':'连接超时，请重试。');
  throw e;
 }finally{clearTimeout(deadline);init?.signal?.removeEventListener('abort',cancel);}
}
export const getPracticeCatalog=()=>practiceRequest<PracticeCatalog>('practice-catalog');
