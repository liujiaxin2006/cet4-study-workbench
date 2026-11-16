import {practiceRequest} from './practice-catalog_GET.schema';
export type FeedbackRow={id:string;userId:number;displayName:string;category:string;paperId:string|null;groupId:string|null;questionNumber:number|null;message:string;status:'new'|'reviewing'|'resolved';adminNote:string;revision:number;createdAt:string};
export type FeedbackList={rows:FeedbackRow[];total:number;page:number;pageSize:number;pending:number};
export const getAdminFeedback=(status='new',page=1)=>practiceRequest<FeedbackList>('admin-feedback?'+new URLSearchParams({status,page:String(page)}));
