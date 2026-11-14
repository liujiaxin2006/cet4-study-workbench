import {practiceRequest} from './practice-catalog_GET.schema';
export type StudyTime={todaySeconds:number;totalSeconds:number;days:{date:string;seconds:number}[]};
export const getStudyTime=()=>practiceRequest<StudyTime>('study-time');
