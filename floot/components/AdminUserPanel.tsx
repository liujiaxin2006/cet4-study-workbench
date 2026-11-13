import {useQuery} from '@tanstack/react-query';
import {Button} from './Button';
import {getAdminUser} from '../endpoints/admin-user_GET.schema';
import {adminFormat} from '../helpers/adminFormat';
import styles from './AdminWorkspace.module.css';
export function AdminUserPanel({id,onClose,className=''}:{id:number;onClose:()=>void;className?:string}){
 const query=useQuery({queryKey:['admin-user',id],queryFn:()=>getAdminUser(id),retry:1});
 return <section className={`${styles.card} ${className}`} id="admin-user-detail" aria-label="用户详情"><div className={styles.cardHeading}><div><p className={styles.eyebrow}>USER DETAIL · 近30天</p><h2>{query.data?.displayName||'用户详情'} <small>#{id}</small></h2></div><Button variant="ghost" size="sm" onClick={onClose}>关闭</Button></div>
 {query.isPending?<p role="status">正在读取用户详情…</p>:query.error?<div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={()=>void query.refetch()}>重试</Button></div>:query.data&&<><p className={styles.muted}>{query.data.email} · {query.data.role==='admin'?'管理员':'学习用户'} · 学习词汇 {query.data.wordCount} 个 · 待复盘 {query.data.unresolvedMistakes} 条</p><div className={styles.detailGrid}><div><h3>板块使用</h3>{query.data.modules.length?query.data.modules.map(m=><div className={styles.detailRow} key={m.module}><span>{m.name}</span><span>{m.visits}次 · {adminFormat.duration(m.seconds)}</span></div>):<p className={styles.empty}>暂无新采集的板块记录</p>}</div><div><h3>每日学习记录（用户确认）</h3>{query.data.days.length?query.data.days.map(d=><div className={styles.detailRow} key={d.date}><span>{d.date.slice(5)} · {d.completed.map(adminFormat.task).join('、')||'未记录任务完成'}</span><span>{d.reportedMinutes}分钟</span></div>):<p className={styles.empty}>近30天没有学习记录</p>}</div></div><details className={styles.disclosure}><summary>最近20次板块访问</summary>{query.data.recentVisits.map((v,i)=><div className={styles.detailRow} key={i}><span>{v.module} · {adminFormat.date(v.startedAt)}</span><span>{adminFormat.duration(v.seconds)}</span></div>)}</details></>}
 </section>;
}
