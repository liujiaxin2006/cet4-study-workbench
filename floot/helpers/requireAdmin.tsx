import { getServerUserSession } from './getServerUserSession';
export class AdminAccessError extends Error {status=403;}
export async function requireAdmin(request:Request){const {user}=await getServerUserSession(request);if(user.role!=='admin')throw new AdminAccessError('当前账号没有后台权限，请使用管理员账号登录。');return user;}
