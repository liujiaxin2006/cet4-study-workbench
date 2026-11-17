import {z} from 'zod';import {schema as registration} from './register_with_password_POST.schema';import {practiceRequest} from '../practice-catalog_GET.schema';
export const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:registration.shape.password,confirmPassword:z.string()}).strict().refine(v=>v.password===v.confirmPassword,'两次密码不一致');
export const postPasswordReset=(body:z.infer<typeof schema>)=>practiceRequest<{ok:boolean}>('auth/password_reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(body))});
