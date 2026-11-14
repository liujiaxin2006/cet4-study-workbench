import {useEffect,useMemo,useReducer} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {getStudyProgress,type StudyState} from '../endpoints/study-progress_GET.schema';
import {postStudyProgress} from '../endpoints/study-progress_POST.schema';
import {useAuth} from './useAuth';
import {StudyProgressSync} from './studyProgressSync';
const EMPTY_STATE:StudyState={version:1,minutes:0,daily:{},words:{},mistakes:[]};
export function useStudyProgress(){
 const {authState}=useAuth();const userId=authState.type==='authenticated'?authState.user.id:null;const client=useQueryClient();const [,update]=useReducer(n=>n+1,0);
 const tabId=useMemo(()=>{try{let id=sessionStorage.getItem('cet4-progress-tab');if(!id){id=crypto.randomUUID();sessionStorage.setItem('cet4-progress-tab',id);}return id;}catch{return crypto.randomUUID();}},[]);
 const writer=useMemo(()=>new StudyProgressSync('cet4-progress:'+userId+':'+tabId,{
  getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k),
 },(body,keepalive)=>postStudyProgress(body,{keepalive}),()=>update(),cloud=>client.setQueryData(['study-progress',userId],cloud)),[userId,client,tabId]);
 const query=useQuery({queryKey:['study-progress',userId],queryFn:getStudyProgress,enabled:userId!==null,retry:1,staleTime:30000,refetchOnWindowFocus:!writer.dirty&&!writer.syncing});
 useEffect(()=>{if(query.data)writer.attach(query.data);},[writer,query.dataUpdatedAt]);
 useEffect(()=>{
  writer.activate();
  const flush=()=>void writer.flush(true).catch(()=>{});
  const hide=()=>{if(document.visibilityState==='hidden')flush();};
  const before=(e:BeforeUnloadEvent)=>{if(writer.dirty){e.preventDefault();e.returnValue='';}};
  window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hide);window.addEventListener('beforeunload',before);
  return()=>{window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hide);window.removeEventListener('beforeunload',before);flush();writer.dispose();};
 },[writer]);
 const saveLocal=(state:StudyState)=>writer.enqueue(state);
 const saveAsync=async(state:StudyState)=>{writer.enqueue(state);await writer.flush();};
 const save=(state:StudyState)=>{try{writer.enqueue(state);}catch{/* Reported by the shared sync banner. */}};
 const exportDraft=()=>{const raw=writer.exportDraft();if(!raw)return;const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cet4-progress-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {...query,state:writer.state??query.data?.state??EMPTY_STATE,save,saveAsync,saveLocal,flush:()=>writer.flush(),saving:writer.dirty||writer.syncing,saveError:writer.error,conflict:writer.conflict,retrySync:()=>writer.retry(getStudyProgress),adoptCloud:async()=>{writer.attach(await getStudyProgress());writer.adoptCloud();},exportDraft};
}
