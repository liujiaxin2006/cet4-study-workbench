import {createContext,useContext,useEffect} from 'react';
export type StudyModule='words'|'reading'|'listening'|'writing'|'review';
export const StudyActivityContext=createContext<(module:StudyModule|null)=>void>(()=>{});
export function useStudyActivity(module:StudyModule,enabled:boolean){
 const setActivity=useContext(StudyActivityContext);
 useEffect(()=>{setActivity(enabled?module:null);return()=>setActivity(null);},[module,enabled,setActivity]);
}
