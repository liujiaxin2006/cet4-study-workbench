import {useState} from 'react';
import type {StudyState} from '../endpoints/study-progress_GET.schema';
import {studyStateSchema} from '../endpoints/study-progress_GET.schema';
import {Button} from './Button';import {Input} from './Input';import styles from '../pages/_index.module.css';
export function StudySettings({state,onSave,saving}:{state:StudyState;onSave:(s:StudyState)=>Promise<void>;saving:boolean}){
 const [prefs,setPrefs]=useState({examDate:'2026-12-12',dailyMinutes:60 as 15|30|60|90,focus:'auto' as 'auto'|'reading'|'listening'|'writing',dailyNewWords:20 as 10|20,textSize:'standard' as 'standard'|'large',showCharacter:true,...state.preferences});const [message,setMessage]=useState('');
 const choices=<T extends string|number,>(label:string,values:readonly T[],value:T,change:(v:T)=>void,labels?:string[])=> <fieldset className={styles.setting}><legend>{label}</legend><div className={styles.segments}>{values.map((v,i)=><Button key={v} variant={v===value?'primary':'outline'} aria-pressed={v===value} onClick={()=>change(v)}>{labels?.[i]||v}</Button>)}</div></fieldset>;
 return <section className={styles.surface}><h2>学习设置</h2><div className={styles.setting}><label htmlFor="exam-date">考试日期</label><Input id="exam-date" placeholder="2026-12-12" inputMode="numeric" value={prefs.examDate} onChange={e=>setPrefs(p=>({...p,examDate:e.target.value}))}/></div>
 {choices('每日学习目标',[15,30,60,90] as const,prefs.dailyMinutes,v=>setPrefs(p=>({...p,dailyMinutes:v})),['15分钟','30分钟','60分钟','90分钟'])}
 {choices('每日新词目标',[10,20] as const,prefs.dailyNewWords,v=>setPrefs(p=>({...p,dailyNewWords:v})),['10个','20个'])}
 {choices('阅读字号',['standard','large'] as const,prefs.textSize,v=>setPrefs(p=>({...p,textSize:v})),['标准','大字'])}
 <label className={styles.setting}><input type="checkbox" checked={prefs.showCharacter} onChange={e=>setPrefs(p=>({...p,showCharacter:e.target.checked}))}/> 显示书签伙伴小签</label>
 <Button disabled={saving} onClick={async()=>{const next=studyStateSchema.safeParse({...state,preferences:prefs});if(!next.success){setMessage('请填写有效日期，例如2026-12-12。');return;}try{await onSave(next.data);setMessage('已保存');}catch(e){setMessage(e instanceof Error?e.message:'保存失败，请重试。');}}}>{saving?'保存中…':'保存设置'}</Button><p role="status">{message}</p></section>;
}
