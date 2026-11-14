import {getWordContext,type WordContext} from "../endpoints/word-context_GET.schema";
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Volume2, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "./Button";
import {useStudyActivity} from "../helpers/studyActivity";
import { wordBank } from "../helpers/wordBank";
import { vocabularyPractice } from "../helpers/vocabularyPractice";
import type { StudyState } from "../endpoints/study-progress_GET.schema";
import styles from "./VocabularyPractice.module.css";

type Props = { state: StudyState; today: string; saving: boolean; onSave: (state: StudyState) => Promise<void>; onNext: () => void };
export function VocabularyPractice({ state, today, saving, onSave, onNext }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const limit=state.preferences?.wordCount||10;
  const cards=wordBank;
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [contexts,setContexts]=useState<WordContext|null>(null);const [contextBusy,setContextBusy]=useState(false);
  const [busy, setBusy] = useState(false);
  const gate = useRef(false);
  const panel = useRef<HTMLElement>(null);
  const session = state.vocabularySession?.date === today ? state.vocabularySession : undefined;
  const current = wordBank.find(w => w.word === session?.queue[0]);
  const currentWordRef=useRef("");currentWordRef.current=current?.word||"";
  const preview = vocabularyPractice.start(state, cards, today, limit);
  const due = cards.filter(w => state.words[w.word] && Date.parse(state.words[w.word].dueAt) <= Date.now()).length;
  const fresh = cards.filter(w => !state.words[w.word]).length;
  const weak = cards.filter(w => state.mistakes.some(m => m.area === "vocabulary" && m.prompt === w.word && !m.resolved));
  const disabled = saving || busy;
  const finished = !!session && session.queue.length === 0;
  useStudyActivity("words",!!current&&!finished&&!paused);
  const sameCardAttempt = current ? session?.attempts[current.word] : undefined;

  useEffect(() => { setRevealed(false); setShowTranslation(false);setContexts(null); }, [current?.word, sameCardAttempt, session?.startedAt]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  async function persist(next: StudyState, message: string) {
    if (gate.current || saving) return false;
    gate.current = true; setBusy(true); setError("");
    try { await onSave(next); setNotice(""); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "保存失败，请重试。"); return false; }
    finally { gate.current = false; setBusy(false); }
  }
  async function start(mode: "normal" | "review" | "weak" = "normal") {
    let next = vocabularyPractice.start(state, cards, today, limit, Date.now(), mode === "review");
    if (mode === "weak") { const queue = weak.slice(0, limit).map(w => w.word); next = { ...next, queue, total: queue.length }; }
    if (!next.queue.length) { setNotice("现在没有需要开始的词卡，可以继续阅读训练。"); return; }
    if (await persist({ ...state, vocabularySession: next }, "")) {
      setPaused(false); setRevealed(false); setShowTranslation(false);
    }
  }
  async function grade(remembered: boolean) {
    if (!current || !revealed || disabled) return;
    const next = vocabularyPractice.grade(state, current, remembered);
    const deferred = next.vocabularySession?.deferred.includes(current.word);
    const message = remembered
      ? current.word + " 已记录，下次复习：" + new Date(next.words[current.word].dueAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric" })
      : deferred ? current.word + " 暂存到易忘词，10 分钟后可再次复习。"
      : current.word + " 会在本轮后面再次出现。";
    if (await persist(next, message)) { setRevealed(false); setShowTranslation(false); }
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setError("当前浏览器不支持朗读，请换用系统浏览器。"); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text); speech.lang = "en-US"; speech.rate = 0.85;
    speech.onerror = e => { if (e.error !== "canceled" && e.error !== "interrupted") setError("发音未播放，请检查音量或换用系统浏览器。"); };
    window.speechSynthesis.speak(speech);
  }
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!panel.current?.contains(document.activeElement) || e.repeat || disabled || paused || !current) return;
      if (e.key === " " && !revealed) { e.preventDefault(); setRevealed(true); }
      if (revealed && (e.key === "1" || e.key === "2")) { e.preventDefault(); void grade(e.key === "2"); }
    };
    window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle);
  });
  return <section ref={panel} className={styles.panel} aria-label="词汇主动回忆" tabIndex={0}>
    <div className={styles.heading}><div><h2>背单词</h2></div><span className={styles.badge}>待复习 {due} · 新词 {fresh}</span></div>
    {error && <p className={styles.error} role="alert">{error} 本次操作未确认保存。请检查当前词卡后重试，切勿直接当作完成。</p>}
    <p className={styles.notice} role="status" aria-live="polite">{disabled ? "正在保存到账号…" : notice}</p>
    {(!session || finished) && <div className={styles.setup}>
      {finished ? <><Check className={styles.finishIcon} size={32}/><h3>这一轮完成了</h3><p>{session.total} 个词 · 待加强 {session.deferred.length} 个</p></> : <p className={styles.roundLabel}>每组 {limit} 词</p>}
      <div className={styles.actions}><Button size="lg" disabled={disabled||preview.total===0} onClick={()=>void start()}>开始{finished?"下一轮":"学习"}</Button>{finished&&<Button variant="outline" onClick={onNext}>去练习 <ArrowRight size={18}/></Button>}</div>
      {!preview.total && <p>到期词已复习完，暂时没有新词。休息一下或继续阅读，记住的词会在到期后回来。</p>}
    </div>}
    {session && !finished && (paused ? <div className={styles.setup}><h3>已暂停，进度已保存</h3><p>还有 {session.queue.length} 个词。回来时会从当前词继续。</p><Button onClick={() => setPaused(false)}><Play size={18}/>继续这一轮</Button></div> : current ? <>
      <div className={styles.row}><span>本轮已处理 {session.total-session.queue.length} / {session.total} · 待练 {session.queue.length}</span><Button size="sm" variant="ghost" disabled={disabled} onClick={() => setPaused(true)}><Pause size={16}/>暂停</Button></div>
      <div className={styles.progress} role="progressbar" aria-label="本轮进度" aria-valuemin={0} aria-valuemax={session.total} aria-valuenow={session.total-session.queue.length}><i style={{width: ((session.total-session.queue.length)/session.total*100)+"%"}}/></div>
      <div className={styles.card}>
        <span className={styles.badge}>{session.missed.includes(current.word) ? "再次回忆" : state.words[current.word] ? "复习词" : "新词"}</span>
        <h3>{current.word}</h3><div className={styles.pronunciation}><span>{current.phonetic}</span><Button variant="ghost" size="sm" aria-label={"朗读 "+current.word} onClick={() => speak(current.word)}><Volume2 size={18}/>听发音</Button></div>
        {!revealed ? <div className={styles.prompt}><strong>还记得它的意思吗？</strong></div> : <div className={styles.answer}>
          <strong>{current.meaning}</strong>
          {current.collocation && <p>常用搭配 · {current.collocation}</p>}
          {current.example ? <><p className={styles.example}>{current.example}</p><div className={styles.actions}><Button variant="ghost" size="sm" onClick={() => speak(current.example!)}><Volume2 size={16}/>听例句</Button>{current.translation && <Button variant="ghost" size="sm" onClick={() => setShowTranslation(v => !v)}>{showTranslation ? "隐藏中文" : "查看例句中文"}</Button>}</div>{showTranslation && current.translation && <p>{current.translation}</p>}</> : null}

          <Button variant="outline" size="sm" disabled={contextBusy} onClick={async()=>{setContextBusy(true);try{const requested=current.word;const result=await getWordContext(requested);if(currentWordRef.current===requested)setContexts(result);}catch(e){setError(e instanceof Error?e.message:"语境读取失败");}finally{setContextBusy(false);}}}>{contextBusy?"读取中…":"查看已发布真题语境"}</Button>
          {contexts&&<div>{contexts.contexts.length?contexts.contexts.map((c,i)=><p className={styles.example} key={i}>{c.text}<small className={styles.note}>{c.paper} · {c.group}</small></p>):<p className={styles.note}>已发布题组中暂未找到匹配语境；待相关材料校对发布后补充。</p>}</div>}
        </div>}
      </div>
      <div className={styles.grading}>
        {!revealed ? <Button size="lg" disabled={disabled} onClick={() => setRevealed(true)}>查看释义</Button> : <>
          <Button size="lg" variant="outline" disabled={disabled} onClick={() => void grade(false)}><RotateCcw size={18}/>没记住</Button>
          <Button size="lg" disabled={disabled} onClick={() => void grade(true)}><Check size={18}/>记住了</Button>
        </>}
      </div>

    </> : <p role="alert">当前词卡不在词库中，请重新打开页面加载最新词库。</p>)}
  </section>;
}

