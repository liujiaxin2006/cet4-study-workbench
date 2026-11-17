import {z} from 'zod';import {practiceRequest} from '../practice-catalog_GET.schema';
export const schema=z.object({email:z.string().trim().toLowerCase().email('请输入有效邮箱').max(254)}).strict();
export const postPasswordRecovery=(body:z.infer<typeof schema>)=>practiceRequest<{message:string}>('auth/password_recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(body))});
