import {StudyProgressSync} from './studyProgressSync';
import type {StudyState} from '../endpoints/study-progress_GET.schema';
const state=(minutes=0):StudyState=>({version:1,minutes,daily:{},words:{},mistakes:[]});
describe('durable nonblocking progress sync',()=>{
 let items:Map<string,string>,storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,writers:StudyProgressSync[];
 const create=(send:any,key='account-1')=>{const w=new StudyProgressSync(key,storage,send,()=>{},()=>{});writers.push(w);return w;};
 beforeEach(()=>{items=new Map();storage={getItem:k=>items.get(k)??null,setItem:(k,v)=>{items.set(k,v);},removeItem:k=>{items.delete(k);}};writers=[];});
 afterEach(()=>writers.forEach(w=>w.dispose()));
 it('advances locally before a slow request and serializes only the newest pending state',async()=>{
  const calls:any[]=[];const resolve:((x:{revision:number})=>void)[]=[];
  const w=create((body:any)=>{calls.push(body);return new Promise(r=>resolve.push(r));});w.attach({state:state(),revision:1});w.enqueue(state(1));const done=w.flush();w.enqueue(state(2));w.enqueue(state(3));
  expect(w.state?.minutes).toBe(3);expect(JSON.parse(items.get('account-1')!).state.minutes).toBe(3);expect(calls.length).toBe(1);
  resolve[0]({revision:2});await Promise.resolve();await Promise.resolve();expect(calls.length).toBe(2);expect(calls[1].revision).toBe(2);expect(calls[1].state.minutes).toBe(3);
  resolve[1]({revision:3});await done;expect(w.dirty).toBeFalse();expect(items.has('account-1')).toBeFalse();
 });
 it('coalesces several clicks before sending a request',async()=>{const calls:any[]=[];const w=create(async(b:any)=>{calls.push(b);return {revision:2};});w.attach({state:state(),revision:1});w.enqueue(state(1));w.enqueue(state(2));w.enqueue(state(3));await w.flush();expect(calls.length).toBe(1);expect(calls[0].state.minutes).toBe(3);});
 it('recovers a lost response without discarding newer locally saved progress',async()=>{
  const w=create(async()=>{throw Error('response lost');});w.attach({state:state(),revision:1});w.enqueue(state(1));const failed=w.flush().catch(()=>{});w.enqueue(state(2));await failed;w.dispose();
  const calls:any[]=[];const restored=create(async(b:any)=>{calls.push(b);return {revision:3};});restored.attach({state:state(1),revision:2});expect(restored.state?.minutes).toBe(2);await restored.flush();expect(calls[0].revision).toBe(2);expect(restored.conflict).toBeFalse();
 });
 it('keeps conflicting progress and does not overwrite another device',()=>{items.set('account-1',JSON.stringify({baseRevision:1,state:state(5)}));const w=create(async()=>{throw Error('must not send');});w.attach({state:state(8),revision:3});expect(w.conflict).toBeTrue();expect(w.state?.minutes).toBe(5);expect(()=>w.enqueue(state(6))).toThrow();expect(items.has('account-1')).toBeTrue();});
 it('preserves a backup before an explicit choice of cloud progress',()=>{items.set('account-1',JSON.stringify({baseRevision:1,state:state(5)}));const w=create(async()=>({revision:4}));w.attach({state:state(8),revision:3});w.adoptCloud();expect(w.state?.minutes).toBe(8);expect(items.has('account-1:conflict-backup')).toBeTrue();expect(w.conflict).toBeFalse();});
 it('does not advance when durable local storage is unavailable',()=>{storage.setItem=()=>{throw Error('quota');};const w=create(async()=>({revision:2}));w.attach({state:state(),revision:1});expect(()=>w.enqueue(state(1))).toThrow();expect(w.state?.minutes).toBe(0);expect(w.dirty).toBeFalse();});
 it('keeps accounts separate and ignores stale query responses',()=>{const w=create(async()=>({revision:4}));w.attach({state:state(2),revision:3});w.attach({state:state(),revision:1});expect(w.state?.minutes).toBe(2);w.enqueue(state(5));const other=create(async()=>({revision:1}),'account-2');other.attach({state:state(),revision:0});expect(other.state?.minutes).toBe(0);expect(other.dirty).toBeFalse();});
 it('supports a React effect cleanup and activation cycle',async()=>{const w=create(async()=>({revision:2}));w.attach({state:state(),revision:1});w.dispose();w.activate();w.enqueue(state(1));await w.flush();expect(w.dirty).toBeFalse();});
});
