import superjson from 'superjson';
import { z } from 'zod';
import type { OutputType } from './cet-review_GET.schema';
const answers=z.record(z.string().regex(/^\d{1,2}$/),z.string().regex(/^[A-O]$/)).refine(a=>Object.keys(a).length<=25);
export const schema=z.object({groupId:z.string().min(1).max(40),revision:z.number().int().nonnegative(),action:z.enum(['save','submit','restart']),answers,text:z.string().max(6000)}).strict();
export async function postCetReview(input:z.infer<typeof schema>):Promise<void>{
 const response=await fetch('/_api/cet-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input)),credentials:'same-origin'});
 const data=superjson.parse<any>(await response.text());if(!response.ok)throw new Error(data.error||'保存失败，请重试。');
}
