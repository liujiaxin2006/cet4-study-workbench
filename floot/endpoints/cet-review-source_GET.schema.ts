import superjson from 'superjson';
export async function getCetReviewSource(id:string):Promise<string>{const r=await fetch('/_api/cet-review-source?id='+encodeURIComponent(id),{cache:'no-store'});const d=superjson.parse<any>(await r.text());if(!r.ok)throw new Error(d.error||'读取文件失败。');return d.url;}
