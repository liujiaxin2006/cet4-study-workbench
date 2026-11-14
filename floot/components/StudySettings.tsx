import {useState} from 'react';
import type {StudyState} from '../endpoints/study-progress_GET.schema';
import {studyStateSchema} from '../endpoints/study-progress_GET.schema';
import {Button} from './Button';import {Input} from './Input';import styles from '../pages/_index.module.css';
export function StudySettings({state,onSave,saving}:{state:StudyState;onSave:(s:StudyState)=>Promise<void>;saving:boolean}){
 const [prefs,setPrefs]=useState({examDate:'2026-12-12',dailyMinutes:60 as 30|60|90,focus:'auto' as 'auto'|'reading'|'listening'|'writing',wordCount:10 as 10|20,textSize:'standard' as 'standard'|'large',...state.preferences});const [message,setMessage]=useState('');
 const choices=<T extends string|number,>(label:string,values:readonly T[],value:T,change:(v:T)=>void,labels?:string[])=> <fieldset className={styles.setting}><legend>{label}</legend><div className={styles.segments}>{values.map((v,i)=><Button key={v} variant={v===value?'primary':'outline'} aria-pressed={v===value} onClick={()=>change(v)}>{labels?.[i]||v}</Button>)}</div></fieldset>;
 return <section className={styles.surface}><h2>学习设置</h2><div className={styles.setting}><label htmlFor="exam-date">考试日期</label><Input id="exam-date" placeholder="2026-12-12" inputMode="numeric" value={prefs.examDate} onChange={e=>setPrefs(p=>({...p,examDate:e.target.value}))}/></div>
 {choices('每日学习目标',[30,60,90] as const,prefs.dailyMinutes,v=>setPrefs(p=>({...p,dailyMinutes:v})),['30分钟','60分钟','90分钟'])}
 {choices('每组单词',[10,20] as const,prefs.wordCount,v=>setPrefs(p=>({...p,wordCount:v})),['10个','20个'])}
 {choices('阅读字号',['standard','large'] as const,prefs.textSize,v=>setPrefs(p=>({...p,textSize:v})),['标准','大字'])}
 <Button disabled={saving} onClick={async()=>{const next=studyStateSchema.safeParse({...state,preferences:prefs});if(!next.success){setMessage('请填写有效日期，例如2026-12-12。');return;}try{await onSave(next.data);setMessage('已保存');}catch(e){setMessage(e instanceof Error?e.message:'保存失败，请重试。');}}}>{saving?'保存中…':'保存设置'}</Button><p role="status">{message}</p></section>;
}
