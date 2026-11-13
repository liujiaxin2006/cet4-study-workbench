import {requireAdmin,AdminAccessError} from '../helpers/requireAdmin';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {cetReply} from '../helpers/cetReply';
import {adminDashboardData} from '../helpers/adminDashboardData';
import {z} from 'zod';
const schema=z.object({days:z.enum(['7','30']).default('7'),q:z.string().max(80).default(''),page:z.coerce.number().int().min(1).max(10000).default(1)});
export async function handle(request:Request){try{
 await requireAdmin(request);const parsed=schema.parse(Object.fromEntries(new URL(request.url).searchParams));
 return cetReply(await adminDashboardData({days:Number(parsed.days) as 7|30,q:parsed.q,page:parsed.page}));
 }catch(e){console.error('Admin dashboard read failed',e);return cetReply({error:e instanceof AdminAccessError?e.message:e instanceof NotAuthenticatedError?'请先登录管理员账号。':e instanceof Error&&e.name==='ZodError'?'筛选参数不正确。':'后台数据暂时读取失败，请重试。'},{status:e instanceof AdminAccessError?403:e instanceof NotAuthenticatedError?401:e instanceof Error&&e.name==='ZodError'?400:500});}}
