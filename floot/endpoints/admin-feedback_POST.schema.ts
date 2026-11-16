import {z} from 'zod';import {practiceRequest} from './practice-catalog_GET.schema';
export const schema=z.object({id:z.string().uuid(),revision:z.number().int().min(0),status:z.enum(['new','reviewing','resolved']),adminNote:z.string().trim().max(2000)}).strict();
export const postAdminFeedback=(input:z.infer<typeof schema>)=>practiceRequest<{revision:number}>('admin-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
