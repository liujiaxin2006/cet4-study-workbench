import {vocabularyPractice} from './vocabularyPractice';import type {StudyState} from '../endpoints/study-progress_GET.schema';
const card={word:'evidence',meaning:'证据'};const now=Date.parse('2026-11-13T02:00:00Z');
function begin(state:StudyState,at:number){return {...state,vocabularySession:vocabularyPractice.start(state,[card],'2026-11-13',10,at)};}
function empty():StudyState{return {version:1,minutes:0,daily:{},words:{},mistakes:[]};}
describe('word scheduling after same-day recovery',()=>{
 it('does not advance an early manual repeat to a long interval',()=>{let state=begin(empty(),now);state=vocabularyPractice.grade(state,card,true,now);state={...state,vocabularySession:{...state.vocabularySession!,queue:['evidence']}};state=vocabularyPractice.grade(state,card,true,now+60000);expect(state.words.evidence.intervalDays).toBe(1);expect(state.words.evidence.delayedSuccesses).toBe(0);});
 it('keeps a forgotten word outstanding until two actual delayed successes',()=>{let state=begin(empty(),now);state=vocabularyPractice.grade(state,card,false,now);state=vocabularyPractice.grade(state,card,true,now+1000);expect(state.mistakes[0].resolved).toBeFalse();state=begin(state,now+2*86400000);state=vocabularyPractice.grade(state,card,true,now+2*86400000);expect(state.mistakes[0].resolved).toBeFalse();state=begin(state,now+4*86400000);state=vocabularyPractice.grade(state,card,true,now+4*86400000);expect(state.mistakes[0].resolved).toBeTrue();expect(state.words.evidence.history?.length).toBe(4);});
});
