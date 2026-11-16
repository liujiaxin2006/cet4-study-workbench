import {studyRecommendations} from './studyRecommendations';
import type {StudyState} from '../endpoints/study-progress_GET.schema';
import type {PracticeCatalog} from '../endpoints/practice-catalog_GET.schema';
const now=Date.parse('2026-11-16T16:05:00Z');
const base:StudyState={version:1,minutes:0,daily:{},words:{},mistakes:[]};
function catalog(groups:any[]):PracticeCatalog{return {papers:[{id:'paper',title:'Test',exam:'2026-06',status:'published',groups,issues:[]}],types:[],summary:{papers:1,readyPapers:1,readyGroups:groups.length,readyQuestions:0,due:0},generatedAt:new Date(now).toISOString()};}
describe('next learning task',()=>{
 it('offers a usable fallback before the catalog loads',()=>{expect(studyRecommendations(base,undefined,now).tasks[0].target).toBe('words');});
 it('continues drafts before recommending unseen reading',()=>{const d=catalog([{id:'new',title:'New',ready:true,kind:'reading'},{id:'draft',title:'Draft',ready:true,kind:'reading',inProgress:true}]);expect(studyRecommendations(base,d,now).tasks[0].selection?.groupId).toBe('draft');});
 it('excludes unavailable groups and future reviews',()=>{const d=catalog([{id:'hidden',title:'Hidden',ready:false,kind:'reading'},{id:'future',title:'Future',ready:true,kind:'reading',submitted:true,reviewDueAt:'2026-11-19T00:00:00Z'}]);expect(studyRecommendations(base,d,now).tasks.length).toBe(1);});
 it('counts unique words on Shanghai days beyond round resets',()=>{const w={repetitions:1,intervalDays:1,dueAt:'2026-11-19T00:00:00Z',lastResult:'remembered' as const,lastReviewedAt:'2026-11-16T16:01:00Z'};const state={...base,words:{today:w,yesterday:{...w,lastReviewedAt:'2026-11-16T15:59:00Z'}}};expect(studyRecommendations(state,undefined,now).wordDone).toBe(1);});
});
