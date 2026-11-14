import {sql} from 'kysely';
import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {cetReply} from '../helpers/cetReply';
import {learningPlan} from '../helpers/learningPlan';
export async function handle(request:Request){try{
 const {user}=await getServerUserSession(request);
 const result=await sql<{date:string;seconds:number}>`SELECT to_char(occurred_at AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS date,sum(active_seconds)::integer AS seconds FROM study_usage_ticks WHERE user_id=${user.id} AND module IN ('words','reading','listening','writing','review') GROUP BY 1 ORDER BY 1 DESC`.execute(db);
 const today=learningPlan.dateKey();return cetReply({todaySeconds:result.rows.find(r=>r.date===today)?.seconds||0,totalSeconds:result.rows.reduce((n,r)=>n+Number(r.seconds),0),days:result.rows.slice(0,30)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return cetReply({error:e instanceof NotAuthenticatedError?'请先登录。':'学习时间暂时无法同步。'},{status:e instanceof NotAuthenticatedError?401:503});}}
