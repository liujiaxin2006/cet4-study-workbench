export const usageAccounting = {
 modules:{today:'今日计划',words:'背单词',reading:'阅读',listening:'听力',writing:'写作与翻译',coverage:'题型地图',review:'错题复盘',more:'更多导航'} as Record<string,string>,
 credit(prior:{sequence:number;reportedSeconds:number;lastSeenAt:number},input:{sequence:number;activeSeconds:number},now:number,lastCreditedAt:number){
  if(input.sequence<=prior.sequence)return {duplicate:true,seconds:0};
  const reported=Math.max(0,input.activeSeconds-prior.reportedSeconds);
  const sessionElapsed=Math.max(0,Math.floor((now-prior.lastSeenAt)/1000));
  const userElapsed=Math.max(0,Math.floor((now-lastCreditedAt)/1000));
  return {duplicate:false,seconds:Math.min(45,reported,sessionElapsed,userElapsed)};
 },
 window(days:7|30,now=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const end=new Date(today+'T00:00:00+08:00');end.setTime(end.getTime()+86400000);
  const start=new Date(end.getTime()-days*86400000);
  return {start,end,startDate:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(start),endDate:today};
 },
 maskEmail(email:string){const [local,domain]=email.split('@');return domain?local.slice(0,2)+'***@'+domain:'未提供';}
};
