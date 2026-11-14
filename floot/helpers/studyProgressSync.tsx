import {studyStateSchema,type StudyState} from '../endpoints/study-progress_GET.schema';
type Cloud={state:StudyState;revision:number};
type Draft={baseRevision:number;state:StudyState;inFlight?:Cloud};
const equal=(a:unknown,b:unknown):boolean=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const ak=Object.keys(a),bk=Object.keys(b);
 return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equal((a as any)[k],(b as any)[k]));
};
/** One durable, coalescing writer per account; confirmed revisions never advance speculatively. */
export class StudyProgressSync {
 private cloud?:Cloud;private draft?:Draft;private flight?:Promise<void>;private timer?:ReturnType<typeof setTimeout>;private stopped=false;private loaded=false;
 error:Error|null=null;conflict=false;syncing=false;
 constructor(readonly key:string,private storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,private send:(body:Cloud,keepalive:boolean)=>Promise<{revision:number}>,private changed:()=>void,private confirmed:(cloud:Cloud)=>void){}
 get state(){return this.draft?.state||this.cloud?.state;}
 get dirty(){return !!this.draft;}
 private notify(){if(!this.stopped)this.changed();}
 private write(draft:Draft){this.storage.setItem(this.key,JSON.stringify(draft));this.draft=draft;}
 attach(cloud:Cloud){
  if(this.cloud&&cloud.revision<this.cloud.revision)return;
  this.cloud=cloud;
  if(!this.loaded){this.loaded=true;try{const raw=this.storage.getItem(this.key);if(raw){const d=JSON.parse(raw);if(!Number.isInteger(d.baseRevision)||d.baseRevision<0)throw Error('Invalid revision');this.draft={baseRevision:d.baseRevision,state:studyStateSchema.parse(d.state),...(d.inFlight?{inFlight:{revision:d.inFlight.revision,state:studyStateSchema.parse(d.inFlight.state)}}:{})};}}catch{this.error=new Error('本机草稿暂时无法读取，已保留原缓存；请先导出草稿或重试。');this.conflict=true;this.notify();return;}}
  const d=this.draft;if(!d){this.notify();return;}
  try{
   if(equal(d.state,cloud.state)){this.storage.removeItem(this.key);this.draft=undefined;this.error=null;this.conflict=false;}
   else if(cloud.revision===d.baseRevision){this.conflict=false;}
   else if(d.inFlight&&cloud.revision===d.inFlight.revision+1&&equal(cloud.state,d.inFlight.state)){this.write({baseRevision:cloud.revision,state:d.state});this.conflict=false;}
   else {this.conflict=true;this.error=new Error('另一设备已更新进度，本机未同步草稿仍保留，请先核对。');}
  }catch{this.error=new Error('本机缓存不可写，草稿仍保留；请检查浏览器存储后重试。');this.conflict=true;}
  this.notify();if(this.draft&&!this.conflict&&!this.error)this.schedule();
 }
 enqueue(state:StudyState){
  if(!this.cloud||!this.loaded)throw Error('请先读取学习进度。');
  if(this.conflict)throw this.error||Error('请先解决进度冲突。');
  if(this.error)throw Error('进度暂未同步，请先重试同步。');
  this.write({baseRevision:this.draft?.baseRevision??this.cloud.revision,state,...(this.draft?.inFlight?{inFlight:this.draft.inFlight}:{})});
  this.notify();this.schedule();
 }
 private schedule(){if(this.timer||this.flight)return;this.timer=setTimeout(()=>{this.timer=undefined;void this.flush().catch(()=>{});},5000);}
 async flush(keepalive=false):Promise<void>{
  if(this.timer){clearTimeout(this.timer);this.timer=undefined;}
  if(this.flight)return this.flight;
  if(this.conflict)throw this.error||Error('进度冲突');
  if(this.error)throw this.error;
  if(!this.draft||this.stopped)return;
  this.syncing=true;this.notify();
  this.flight=(async()=>{
   while(this.draft&&!this.stopped){
    const d=this.draft;const sent={state:d.state,revision:d.baseRevision};this.write({...d,inFlight:sent});
    const result=await this.send(sent,keepalive);const cloud={state:sent.state,revision:result.revision};this.cloud=cloud;
    if(this.draft?.state===sent.state){this.storage.removeItem(this.key);this.draft=undefined;}
    else if(this.draft)this.write({baseRevision:result.revision,state:this.draft.state});
    this.confirmed(cloud);this.notify();
   }
  })().catch(e=>{this.error=e instanceof Error?e:new Error('学习进度暂未同步');if((e as {status?:number})?.status===409)this.conflict=true;this.notify();throw this.error;}).finally(()=>{this.flight=undefined;this.syncing=false;this.notify();});
  return this.flight;
 }
 async retry(read:()=>Promise<Cloud>){
  if(this.flight)return this.flight;
  try{const cloud=await read();this.error=null;this.conflict=false;this.attach(cloud);if(!this.conflict)await this.flush();}
  catch(e){this.error=e instanceof Error?e:new Error('同步失败');this.notify();throw this.error;}
 }
 adoptCloud(){
  if(!this.cloud||this.flight)throw Error('请稍后重试。');
  const raw=this.storage.getItem(this.key);if(raw)this.storage.setItem(this.key+':conflict-backup',raw);
  this.storage.removeItem(this.key);this.draft=undefined;this.error=null;this.conflict=false;this.notify();
 }
 exportDraft(){return this.storage.getItem(this.key);}
 activate(){this.stopped=false;}
 dispose(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
}
