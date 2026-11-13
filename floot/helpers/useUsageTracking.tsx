import {useEffect} from 'react';
import superjson from 'superjson';
import {useAuth} from './useAuth';
import {usageAccounting} from './usageAccounting';
export function useUsageTracking(module:string,enabled=true){
 const {authState}=useAuth();const userId=authState.type==='authenticated'&&authState.user.role!=='admin'?authState.user.id:null;
 useEffect(()=>{
  if(!enabled||!userId||!Object.hasOwn(usageAccounting.modules,module))return;
  const id=crypto.randomUUID();let activeMs=0,lastTick=performance.now(),lastInteraction=Date.now(),sequence=0,ready=false,pending=false,stopped=false,lastFlush=0,lastReported=0;
  const tick=()=>{const now=performance.now();const delta=Math.min(5000,Math.max(0,now-lastTick));lastTick=now;if(document.visibilityState==='visible'&&document.hasFocus()&&Date.now()-lastInteraction<90000)activeMs+=delta;};
  async function flush(){if(pending||stopped)return;tick();if(ready&&Math.floor(activeMs/1000)<=lastReported)return;pending=true;lastFlush=performance.now();const action=ready?'pulse':'start';const payload={id,module,sequence:sequence++,activeSeconds:ready?Math.floor(activeMs/1000):0,action};try{const response=await fetch('/_api/study-usage',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true});if(response.ok){const data=superjson.parse<{accepted:boolean}>(await response.text());if(data.accepted){if(action==='start')ready=true;lastReported=payload.activeSeconds;lastFlush=performance.now();}}}catch{/* Metrics must never interrupt learning. */}finally{pending=false;}}
  const interact=()=>{lastInteraction=Date.now();tick();if(!pending&&Math.floor(activeMs/1000)>lastReported&&performance.now()-lastFlush>=300000)void flush();};
  const visibility=()=>{tick();if(document.visibilityState==='hidden')void flush();};
  const finish=()=>{tick();if(ready&&Math.floor(activeMs/1000)>lastReported){const payload=JSON.stringify({id,module,sequence:sequence++,activeSeconds:Math.floor(activeMs/1000),action:'pulse'});try{navigator.sendBeacon('/_api/study-usage',new Blob([payload],{type:'application/json'}));}catch{}}};
  const events=['pointerdown','keydown','scroll','touchstart','mousemove'] as const;
  events.forEach(event=>window.addEventListener(event,interact,{passive:true}));
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',finish);
  // floot-polling-ok: Local activity clock only, no server polling. Client focus cannot be pushed from the server; usage batches come from user events after five minutes or exit.
  const clock=window.setInterval(tick,1000);void flush();
  return()=>{finish();stopped=true;clearInterval(clock);events.forEach(event=>window.removeEventListener(event,interact));document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',finish);};
 },[module,userId,enabled]);
}
