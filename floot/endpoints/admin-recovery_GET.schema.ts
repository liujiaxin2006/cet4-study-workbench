import {practiceRequest} from './practice-catalog_GET.schema';
export type RecoveryRequest={id:string;email:string;userId:number|null;displayName:string|null;status:string;role:string|null;createdAt:string};
export const getAdminRecovery=(status='pending',page=1)=>practiceRequest<{rows:RecoveryRequest[];total:number;page:number}>('admin-recovery?'+new URLSearchParams({status,page:String(page)}));
