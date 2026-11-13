export const learningPlan={
 dateKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);},
 daysUntil(target:string,now=new Date()) {const today=this.dateKey(now);if(!/^20\d{2}-\d{2}-\d{2}$/.test(target)||Number.isNaN(Date.parse(target)))return 0;return Math.max(0,Math.round((Date.parse(target+'T00:00:00+08:00')-Date.parse(today+'T00:00:00+08:00'))/86400000));},
 tasks(minutes=60,focus='auto',date?:string){
  const total=[30,60,90].includes(minutes)?minutes:60;
  const allocation={vocabulary:Math.round(total*.2),reading:Math.round(total*.3),listening:Math.round(total*.3),writing:0};
  allocation.writing=total-allocation.vocabulary-allocation.reading-allocation.listening;
  if(['reading','listening','writing'].includes(focus)){const key=focus as 'reading'|'listening'|'writing';const donor=key==='reading'?'listening':'reading';const extra=Math.min(8,Math.max(0,allocation[donor]-5));allocation[key]+=extra;allocation[donor]-=extra;}
  const day=Math.floor(Date.parse((date||learningPlan.dateKey())+'T00:00:00+08:00')/86400000);
  return [
   {id:'vocabulary',title:'到期词与语境回忆',detail:'先处理到期词；同日重现只算巩固',time:allocation.vocabulary,tab:'words'},
   {id:'reading',title:'阅读真题训练',detail:['仔细阅读：定位证据与排除干扰','选词填空：整篇语境与词性','长篇匹配：信息定位与同义替换'][day%3],time:allocation.reading,tab:'reading'},
   {id:'listening',title:'听力真题训练',detail:['新闻：事件、原因与结果','长对话：目的、问题与方案','篇章：结构、因果与观点'][day%3],time:allocation.listening,tab:'listening'},
   {id:'writing',title:day%2?'写作：回应任务与改写':'翻译：意群、主干与搭配',detail:'短练与完整写译交替；每周另安排完整30分钟训练',time:allocation.writing,tab:'writing'},
  ];
 },
 phase(days:number){return days>42?'打基础与分题型':days>14?'专项查漏与限时训练':days>0?'保留新卷检验、复测错因与考试节奏':'重新设置目标考试日期';},
};
