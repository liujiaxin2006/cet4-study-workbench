export const adminFormat={
 duration(seconds:number){if(seconds<60)return Math.round(seconds)+'秒';if(seconds<3600)return (seconds/60).toFixed(seconds<600?1:0)+'分钟';return (seconds/3600).toFixed(1)+'小时';},
 date(value:string|null){return value?new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'暂无记录';},
 task(value:string){return ({vocabulary:'词汇',reading:'阅读',listening:'听力',writing:'写译'} as Record<string,string>)[value]||value;}
};
