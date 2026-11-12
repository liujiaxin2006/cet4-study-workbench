import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft,Leaf } from 'lucide-react';
import { Button } from '../components/Button';
import { CetReviewPanel } from '../components/CetReviewPanel';
import { getCetReview } from '../endpoints/cet-review_GET.schema';
import { postCetReview } from '../endpoints/cet-review_POST.schema';
import type { ReviewCommand } from '../helpers/cetReview';
import styles from './library-review.module.css';
export default function LibraryReviewPage(){
 const query=useQuery({queryKey:['cet-review'],queryFn:getCetReview,refetchOnWindowFocus:false,retry:1});
 const [busy,setBusy]=useState(false);
 async function save(command:ReviewCommand){setBusy(true);try{await postCetReview(command);await query.refetch({throwOnError:true});}finally{setBusy(false);}}
 return <div className={styles.page}><Helmet><title>CET-4 Copilot · 资料审核</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/></Helmet><header className={styles.header}><Link to="/"><Leaf size={19}/> CET-4 Copilot</Link><Link to="/admin"><ArrowLeft size={15}/>返回管理面板</Link></header><div className={styles.shell}><div className={styles.intro}><p>CONTENT WORKSPACE</p><h1>真题资料库 · 审核样本</h1><span>先确认数据和练习体验，再批量接入其余年份。</span></div>{query.isPending?<p role="status">正在读取私有审核资料…</p>:query.error?<div role="alert"><p>{query.error.message}</p><Button onClick={()=>void query.refetch()}>重新读取</Button></div>:query.data?<CetReviewPanel data={query.data} onSave={save} busy={busy}/>:null}</div></div>;
}
