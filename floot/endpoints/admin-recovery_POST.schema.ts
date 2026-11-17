import {z} from 'zod';import {practiceRequest} from './practice-catalog_GET.schema';
export const schema=z.object({id:z.string().uuid(),action:z.enum(['issue','decline']),identityVerified:z.literal(true)}).strict();
export const postAdminRecovery=(body:z.infer<typeof schema>)=>practiceRequest<{url?:string;expiresAt?:string;ok?:boolean}>('admin-recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
