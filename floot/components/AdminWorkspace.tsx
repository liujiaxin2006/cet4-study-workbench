import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {BookOpen,ChartNoAxesCombined,Leaf,ShieldCheck,Users,ArrowUpRight} from 'lucide-react';
import styles from './AdminWorkspace.module.css';
export function AdminWorkspace({active,onNavigate,children,className=''}:{active:string;onNavigate:(tab:string)=>void;children:ReactNode;className?:string}){
 return <div className={`${styles.page} ${className}`}><header className={styles.topbar}><Link to="/" className={styles.brand}><span><Leaf size={19}/></span>CET-4 Copilot <small>管理后台</small></Link><Link to="/">返回学习端 <ArrowUpRight size={14}/></Link></header><div className={styles.workspace}><aside className={styles.sidebar}><p className={styles.eyebrow}>WORKSPACE</p><nav aria-label="后台导航">{[{id:'overview',label:'运营概览',detail:'用户增长与学习概况',icon:ChartNoAxesCombined},{id:'users',label:'用户与使用',detail:'板块偏好与活跃时长',icon:Users},{id:'library',label:'题库与资料',detail:'试题、答案与整理状态',icon:BookOpen}].map(({id,label,detail,icon:Icon})=><button type="button" key={id} aria-current={active===id?'page':undefined} onClick={()=>onNavigate(id)}><Icon size={18}/><span><strong>{label}</strong><small>{detail}</small></span></button>)}</nav><div className={styles.adminBadge}><ShieldCheck size={15}/><span>管理员专用<br/><small>数据按北京时间统计</small></span></div></aside><main className={styles.content}>{children}</main></div></div>;
}
