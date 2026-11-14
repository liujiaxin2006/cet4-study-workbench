import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import superjson from 'superjson';
import {useAuth} from './useAuth';
import {learningPlan} from './learningPlan';
import {getStudyTime} from '../endpoints/study-time_GET.schema';
import type {StudyModule} from './studyActivity';
export function useStudyTimer(module:StudyModule|null){
 const {authState}=useAuth(),client=useQueryClient();const userId=authState.type==='authenticated'?authState.user.id:null;
 const query=useQuery({queryKey:['study-time',userId],queryFn:getStudyTime,enabled:userId!==null,staleTime:60000,refetchOnWindowFocus:true,retry:1});
 const [syncError,setSyncError]=useState<Error|null>(null);const [delta,setDelta]=useState(0),[paused,setPaused]=useState(false);const accrued=useRef(0),dayStart=useRef(0),initialized=useRef(false),day=useRef(learningPlan.dateKey());const [base,setBase]=useState({today:0,total:0});
 useEffect(()=>{accrued.current=0;dayStart.current=0;initialized.current=false;setBase({today:0,total:0});setDelta(0);},[userId]);
 useEffect(()=>{if(query.data){const data=query.data;if(!initialized.current){initialized.current=true;setBase({today:data.todaySeconds,total:data.totalSeconds});}else setBase(b=>({today:Math.max(b.today,data.todaySeconds-(accrued.current-dayStart.current)),total:Math.max(b.total,data.totalSeconds-accrued.current)}));}},[query.dataUpdatedAt]);
 useEffect(()=>{
  if(!userId||!module||paused)return;
  const id=crypto.randomUUID();let seconds=0,last=performance.now(),interaction=Date.now(),sequence=0,ready=false,pending=false,stopped=false,reported=0,lastFlush=performance.now();
  const tick=()=>{const now=performance.now(),dt=Math.min(2,Math.max(0,(now-last)/1000));last=now;const date=learningPlan.dateKey();if(date!==day.current){day.current=date;dayStart.current=accrued.current;setBase(b=>({...b,today:0}));void client.invalidateQueries({queryKey:['study-time',userId]});}const playing=Array.from(document.querySelectorAll('audio')).some(a=>!a.paused&&!a.ended);if(document.visibilityState==='visible'&&document.hasFocus()&&(Date.now()-interaction<600000||playing)){seconds+=dt;accrued.current+=dt;setDelta(Math.floor(accrued.current));}};
  async function flush(){if(pending||stopped)return;tick();if(ready&&Math.floor(seconds)<=reported)return;pending=true;lastFlush=performance.now();const action=ready?'pulse':'start';const sent=ready?Math.floor(seconds):0;try{const r=await fetch('/_api/study-usage',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,module,sequence:sequence++,activeSeconds:sent,action}),keepalive:true});if(r.ok&&superjson.parse<{accepted:boolean}>(await r.text()).accepted){ready=true;reported=sent;setSyncError(null);if(action==='pulse')void client.invalidateQueries({queryKey:['study-time',userId]});}else setSyncError(new Error('学习时间暂未同步'));}catch{setSyncError(new Error('学习时间暂未同步'));}finally{pending=false;}}
  const interact=()=>{tick();interaction=Date.now();if(performance.now()-lastFlush>=(ready?300000:30000))void flush();};
  const finish=()=>{tick();if(ready&&Math.floor(seconds)>reported){const sent=Math.floor(seconds);reported=sent;void fetch('/_api/study-usage',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,module,sequence:sequence++,activeSeconds:sent,action:'pulse'}),keepalive:true}).then(async r=>{if(r.ok&&superjson.parse<{accepted:boolean}>(await r.text()).accepted){setSyncError(null);void client.invalidateQueries({queryKey:['study-time',userId],refetchType:document.visibilityState==='visible'?'active':'none'});}else setSyncError(new Error('学习时间暂未同步'));}).catch(()=>setSyncError(new Error('学习时间暂未同步')));}};
  const visibility=()=>{tick();if(document.visibilityState==='hidden')finish();};
  const events=['pointerdown','keydown','scroll','touchstart','mousemove'] as const;events.forEach(e=>window.addEventListener(e,interact,{passive:true}));document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',finish);
  // floot-polling-ok: Only a local clock. Network writes come from user activity after five minutes or exit, never from this timer.
  const timer=window.setInterval(tick,1000);void flush();
  return()=>{finish();stopped=true;window.clearInterval(timer);events.forEach(e=>window.removeEventListener(e,interact));document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',finish);};
 },[module,userId,paused,client]);
 const todaySeconds=Math.floor(base.today+Math.max(0,delta-dayStart.current));const days=(query.data?.days||[]).filter(d=>d.date!==day.current);if(todaySeconds)days.unshift({date:day.current,seconds:todaySeconds});
 return {todaySeconds,totalSeconds:Math.floor(base.total+delta),days:days.slice(0,30),running:!!module&&!paused,paused,setPaused,error:query.error||syncError};
}
