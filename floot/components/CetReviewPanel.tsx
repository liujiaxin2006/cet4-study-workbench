import { useEffect,useRef,useState } from 'react';
import { BookOpen,CheckCircle2,ChevronRight,FileText,Headphones,Save,ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Textarea } from './Textarea';
import type { OutputType } from '../endpoints/cet-review_GET.schema';
import { getCetReviewSource } from '../endpoints/cet-review-source_GET.schema';
import { cetReview,type ReviewCommand } from '../helpers/cetReview';
import styles from './CetReviewPanel.module.css';

type Props={data:OutputType;onSave:(command:ReviewCommand)=>Promise<void>;busy?:boolean;className?:string;preview?:boolean};
export function CetReviewPanel({data,onSave,busy=false,className='',preview=false}:Props){
 const [groupId,setGroupId]=useState('reading-one');
 const [answers,setAnswers]=useState(data.attempt.answers);
 const [texts,setTexts]=useState(data.attempt.texts);
 const [dirty,setDirty]=useState(false);
 const [notice,setNotice]=useState('');const [error,setError]=useState('');
 const [audioUrl,setAudioUrl]=useState('');const [audioBusy,setAudioBusy]=useState(false);
 const [links,setLinks]=useState<Record<string,string>>({});const [sourceBusy,setSourceBusy]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{setAnswers(data.attempt.answers);setTexts(data.attempt.texts);setDirty(false);},[data.attempt.revision,data.paper.id]);
 const group=data.paper.groups.find(g=>g.id===groupId)??data.paper.groups[0];
 const submitted=data.attempt.submittedGroups.includes(group.id);
 const selected=Object.fromEntries(group.questions.flatMap(q=>answers[String(q.number)]?[[String(q.number),answers[String(q.number)]]]:[]));
 const answered=Object.keys(selected).length;
 const score=cetReview.score(group,data.attempt.answers);
 async function save(action:ReviewCommand['action']):Promise<boolean>{
  setError('');setNotice('');
  try{await onSave({groupId:group.id,revision:data.attempt.revision,action,answers:action==='restart'?{}:selected,text:action==='restart'?'':texts[group.id]??''});setDirty(false);setNotice(action==='submit'?'本组已提交，解析已解锁。':action==='restart'?'本组已重新开始。':'草稿已保存，可换设备继续。');return true;}
  catch(e){setError(e instanceof Error?e.message:'保存失败，当前答案仍保留。');return false;}
 }
 async function switchGroup(id:string){if(id===group.id||busy)return;if(dirty&&!(await save('save')))return;setGroupId(id);setNotice('');setError('');requestAnimationFrame(()=>heading.current?.focus());}
 async function loadSource(id:string){if(preview){setError('交互预览不申请私有文件链接；请在管理员资料审核页打开原卷或音频。');return;}
  setError('');if(id==='sample-audio')setAudioBusy(true);else setSourceBusy(id);
  try{const url=await getCetReviewSource(id);if(id==='sample-audio')setAudioUrl(url);else setLinks(old=>({...old,[id]:url}));}catch(e){setError(e instanceof Error?e.message:'读取文件失败。');}finally{setAudioBusy(false);setSourceBusy('');}}
 function locate(label:string){document.getElementById('cet-paragraph-'+group.id+'-'+label)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});}
 return <div className={`${styles.panel} ${className}`}>
  <section className={styles.banner}><ShieldCheck size={20}/><div><strong>{preview?'交互预览 · 不写入账号':'管理员资料审核 · 暂未向普通用户开放'}</strong><span>样本用于检查提取质量与练习流程；参考答案不标为官方答案。</span></div></section>
  <section className={styles.summary} aria-label="资料盘点"><div><span>本次资料</span><strong>{data.inventory.fileCount}<small>份文件</small></strong></div><div><span>考试场次目录</span><strong>{data.inventory.sessions.length}<small>个</small></strong></div><div><span>PDF需OCR或检查</span><strong>{data.inventory.lowTextFiles}<small>份</small></strong></div><div><span>当前审核样本</span><strong>55<small>客观题 + 2项写译</small></strong></div></section>
  <details className={styles.inventory}><summary>查看2017—2026资料覆盖与缺项 <ChevronRight size={16}/></summary><p>文件共{(data.inventory.totalBytes/1048576).toFixed(1)} MB；文件数包含不同排版和解析副本，不等于套数。另有{data.inventory.legacyWordFiles}份旧版Word需要转换。</p><div className={styles.tableWrap}><table><caption>按考试场次盘点的文件数量</caption><thead><tr><th>场次</th><th>试卷文件</th><th>解析文件</th><th>音频文件</th><th>需处理文件</th></tr></thead><tbody>{data.inventory.sessions.map(s=><tr key={s.exam}><th>{s.exam}</th><td>{s.paperFiles}</td><td>{s.answerFiles}</td><td>{s.audioFiles||'缺'}</td><td>{s.filesRequiringReview}</td></tr>)}</tbody></table></div><p>精确重复{data.inventory.exactDuplicateGroups.length}组；归一化文字一致{data.inventory.sameNormalizedTextGroups.length}组。文字相同只作为复核线索，不自动认定为同一套试卷。</p>{data.inventory.exactDuplicateGroups.map((paths,i)=><p key={i} className={styles.warning}>重复文件：{paths.join('；')}</p>)}</details>
  <div className={styles.layout}>
   <aside className={styles.sidebar}><p className={styles.eyebrow}>2023 JUNE · PAPER 01</p><h2>{data.paper.title}</h2><p className={styles.muted}>9组材料 · 8类题型</p><nav aria-label="样本题型">{data.paper.groups.map(g=><button type="button" disabled={busy} key={g.id} aria-current={g.id===group.id?'page':undefined} onClick={()=>void switchGroup(g.id)}><span>{g.title}</span>{data.attempt.submittedGroups.includes(g.id)?<CheckCircle2 size={16}/>:<ChevronRight size={15}/>}</button>)}</nav><details className={styles.sources}><summary>原始资料与核对说明</summary>{data.paper.reviewNotes.map(n=><p key={n}>{n}</p>)}{data.paper.sources.filter(s=>s.contentType==='application/pdf').map(s=><div key={s.id}><Button variant="outline" size="sm" disabled={!!sourceBusy} onClick={()=>void loadSource(s.id)}><FileText size={14}/>{sourceBusy===s.id?'准备中…':s.id==='sample-paper'?'获取原卷链接':'获取参考解析链接'}</Button>{links[s.id]&&<a href={links[s.id]} target="_blank" rel="noreferrer">打开私有文件（1小时内有效）</a>}</div>)}</details></aside>
   <main className={styles.practice}>
    <div className={styles.groupHeading}><div><p className={styles.eyebrow}>原卷第 {group.sourcePages.join('、')} 页</p><h2 tabIndex={-1} ref={heading}>{group.title}</h2></div><span className={styles.pill}>{submitted?'已提交':dirty?'有未保存修改':'练习中'}</span></div>
    <p className={styles.note}>{group.note}</p>
    {group.audio&&<section className={styles.audio}><Headphones size={20}/><div><strong>整套原始听力文件</strong><p>卷面与参考原文已关联；录音匹配和时间切片待听审。本组结果不作为正式模考成绩。</p><Button variant="outline" disabled={audioBusy} onClick={()=>void loadSource('sample-audio')}>{audioBusy?'读取中…':audioUrl?'刷新音频链接':'加载私有音频'}</Button>{audioUrl&&<audio controls preload="metadata" src={audioUrl} onError={()=>{setAudioUrl('');setError('音频读取失败或链接已过期，请重新加载。');}}>当前浏览器不支持音频播放。</audio>}</div></section>}
    {group.paragraphs.length>0&&<article className={styles.article} aria-label="阅读原文"><div className={styles.readingLabel}><BookOpen size={17}/> 原文 · 先读后答</div>{group.paragraphs.map(p=><p key={p.label} id={'cet-paragraph-'+group.id+'-'+p.label}><span className={styles.paragraphLabel}>{p.label}</span>{p.text}</p>)}</article>}
    {group.task&&<article className={styles.task}><p>{group.task}</p><label htmlFor={'draft-'+group.id}>你的{group.kind==='writing'?'作文':'译文'}</label><Textarea id={'draft-'+group.id} disabled={submitted||busy} value={texts[group.id]??''} maxLength={6000} className={styles.draft} onChange={e=>{setTexts(t=>({...t,[group.id]:e.target.value}));setDirty(true);setNotice('');}} placeholder="先独立完成，再提交查看参考表达。"/>{group.kind==='writing'&&<p className={styles.muted}>{((texts[group.id]??'').match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length} / 120—180词</p>}</article>}
    {group.questions.map(q=><section className={styles.question} key={q.number}><h3>第{q.number}题 <span>{q.prompt}</span></h3><div className={`${styles.choices} ${group.kind==='cloze'||group.kind==='matching'?styles.compact:''}`} role="group" aria-label={'第'+q.number+'题选项'}>{Object.entries(q.choices).sort(([a],[b])=>a.localeCompare(b)).map(([key,text])=><button type="button" key={key} aria-pressed={answers[String(q.number)]===key} disabled={submitted||busy} className={`${answers[String(q.number)]===key?styles.selected:''} ${submitted&&key===q.answer?styles.correct:''} ${submitted&&answers[String(q.number)]===key&&key!==q.answer?styles.incorrect:''}`} onClick={()=>{setAnswers(a=>({...a,[String(q.number)]:key}));setDirty(true);setNotice('');}}><b>{key}</b><span>{text}</span></button>)}</div>
     {submitted&&q.analysis&&<div className={styles.analysis}><div className={styles.analysisTitle}><strong>{answers[String(q.number)]===q.answer?'答对了':'本题答错'} · 正确答案 {q.answer}</strong><span>{q.analysis.kind}</span></div><p className={styles.evidence}>“{q.analysis.evidence}”</p>{q.analysis.paragraph&&<button type="button" className={styles.locate} onClick={()=>locate(q.analysis!.paragraph!)}>定位原文第{q.analysis.paragraph}段 ↑</button>}<p>{q.analysis.explanation}</p><details><summary>展开选项分析与复盘建议</summary>{q.analysis.options&&Object.entries(q.analysis.options).map(([key,text])=><p key={key}><b>{key}：</b>{text}</p>)}{q.analysis.vocabulary?.map(w=><span className={styles.word} key={w}>{w}</span>)}<p><b>下一步：</b>{q.analysis.action}</p></details></div>}
    </section>)}
    {submitted&&group.reference&&<section className={styles.analysis}><h3>参考表达与自查</h3><p className={styles.model}>{group.reference}</p>{group.rubric?.map(r=><p key={r}>□ {r}</p>)}<p>本样本提供参考表达，不自动给出四级报道分。</p></section>}
    <div className={styles.actionBar}><div>{group.questions.length>0?<strong>{submitted?`本组 ${score.correct} / ${score.total} 正确`:`已选 ${answered} / ${group.questions.length}`}</strong>:<strong>{submitted?'参考表达已解锁':'完成后提交查看参考表达'}</strong>}<span>{preview?'预览数据仅在本页保留':'本组草稿保存到当前账号；切换题型前自动保存。'}</span></div><div className={styles.actions}>{submitted?<Button variant="outline" disabled={busy} onClick={()=>void save('restart')}>重新练习本组</Button>:<><Button variant="outline" disabled={busy||!dirty} onClick={()=>void save('save')}><Save size={16}/>保存草稿</Button><Button disabled={busy||(group.questions.length>0?answered!==group.questions.length:!texts[group.id]?.trim())} onClick={()=>void save('submit')}>{busy?'保存中…':'提交本组'}</Button></>}</div></div>
    <p role="status" className={styles.notice}>{notice}</p>{error&&<p role="alert" className={styles.error}>{error}</p>}
   </main>
  </div>
 </div>;
}
