import {z} from 'zod';
import {practiceRequest} from './practice-catalog_GET.schema';
export const schema=z.object({id:z.string().uuid(),category:z.enum(['question','answer','audio','usability','account']),paperId:z.string().min(1).max(100).optional(),groupId:z.string().min(1).max(100).optional(),questionNumber:z.number().int().min(1).max(55).optional(),message:z.string().trim().min(5,'请至少填写5个字').max(2000)}).strict().refine(v=>!v.groupId||!!v.paperId,'题组需要对应试卷').refine(v=>!v.questionNumber||!!v.groupId,'题号需要对应题组');
export type FeedbackInput=z.infer<typeof schema>;
export const postStudyFeedback=(input:FeedbackInput)=>practiceRequest<{id:string}>('study-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
