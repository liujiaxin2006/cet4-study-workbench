import {z} from 'zod';
export const schema=z.object({id:z.string().uuid(),module:z.enum(['today','words','reading','listening','writing','coverage','review','more']),sequence:z.number().int().min(0).max(10000000),activeSeconds:z.number().int().min(0).max(2592000),action:z.enum(['start','pulse'])}).strict();
