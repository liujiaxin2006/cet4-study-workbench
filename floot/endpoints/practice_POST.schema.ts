import {z} from 'zod';import {practiceRequest} from './practice-catalog_GET.schema';
export const schema=z.object({paperId:z.string().regex(/^cet4-[\d-]+$/).max(50),groupId:z.string().regex(/^[a-z0-9-]+$/).max(60),revision:z.number().int().min(0),action:z.enum(['save','submit','restart']),answers:z.record(z.string().regex(/^\d{1,2}$/),z.string().regex(/^[A-P]$/)),confidence:z.record(z.string().regex(/^\d{1,2}$/),z.boolean()),text:z.string().max(6000)}).strict();
export type PracticeCommand=z.infer<typeof schema>;
export const postPractice=(input:PracticeCommand)=>practiceRequest<{revision:number}>('practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
