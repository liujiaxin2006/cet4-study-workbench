import type {ReviewGroup} from '../helpers/cetReview';
import type {PracticeState} from '../helpers/practiceModel';
import {practiceRequest} from './practice-catalog_GET.schema';
export type PracticeOutput={paper:{id:string;title:string;exam:string;version:number};group:ReviewGroup;state:PracticeState};
export const getPractice=(paperId:string,groupId:string)=>practiceRequest<PracticeOutput>('practice?paperId='+encodeURIComponent(paperId)+'&groupId='+encodeURIComponent(groupId));
