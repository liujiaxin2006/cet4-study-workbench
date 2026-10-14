import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Volume2, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "./Button";
import { wordBank } from "../helpers/wordBank";
import { vocabularyPractice } from "../helpers/vocabularyPractice";
import type { StudyState } from "../endpoints/study-progress_GET.schema";
import styles from "./VocabularyPractice.module.css";

type Props = { state: StudyState; today: string; saving: boolean; onSave: (state: StudyState) => Promise<void>; onNext: () => void };
export function VocabularyPractice({ state, today, saving, onSave, onNext }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [limit, setLimit] = useState(10);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const gate = useRef(false);
  const panel = useRef<HTMLElement>(null);
  const session = state.vocabularySession?.date === today ? state.vocabularySession : undefined;
  const current = wordBank.find(w => w.word === session?.queue[0]);
  const preview = vocabularyPractice.start(state, wordBank, today, limit);
  const due = wordBank.filter(w => state.words[w.word] && Date.parse(state.words[w.word].dueAt) <= Date.now()).length;
  const fresh = wordBank.filter(w => !state.words[w.word]).length;
  const weak = wordBank.filter(w => state.mistakes.some(m => m.area === "vocabulary" && m.prompt === w.word && !m.resolved));
  const disabled = saving || busy;
  const finished = !!session && session.queue.length === 0;
  const sameCardAttempt = current ? session?.attempts[current.word] : undefined;

  useEffect(() => { setRevealed(false); setShowTranslation(false); }, [current?.word, sameCardAttempt, session?.startedAt]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  async function persist(next: StudyState, message: string) {
    if (gate.current || saving) return false;
    gate.current = true; setBusy(true); setError("");
    try { await onSave(next); setNotice(message); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "保存失败，请重试。"); return false; }
    finally { gate.current = false; setBusy(false); }
  }
  async function start(mode: "normal" | "review" | "weak" = "normal") {
    let next = vocabularyPractice.start(state, wordBank, today, limit, Date.now(), mode === "review");
    if (mode === "weak") { const queue = weak.slice(0, limit).map(w => w.word); next = { ...next, queue, total: queue.length }; }
    if (!next.queue.length) { setNotice("现在没有需要开始的词卡，可以继续阅读训练。"); return; }
    if (await persist({ ...state, vocabularySession: next }, "新一轮已保存。先回忆，再查看释义。")) {
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
    <div className={styles.heading}><div><span className={styles.kicker}>每天一点，反复想起</span><h2>词汇复习</h2></div><span className={styles.badge}>{due} 个到期 · {fresh} 个新词</span></div>
    {error && <p className={styles.error} role="alert">{error} 本次操作未确认保存。请检查当前词卡后重试，切勿直接当作完成。</p>}
    <p className={styles.notice} role="status" aria-live="polite">{disabled ? "正在保存到账号…" : notice || "每次选择后保存到云端，换设备可接着这一轮复习。"}</p>
    {(!session || finished) && <div className={styles.setup}>
      {finished ? <><Check className={styles.finishIcon} size={32} /><h3>这一轮完成了</h3><p>本轮 {session.total} 个词，{session.total - session.deferred.length} 个已回忆起来；{session.missed.length} 个曾经忘记。</p>{session.deferred.length > 0 && <p>仍需加强：{session.deferred.join("、")}。已安排 10 分钟后复习，也可从易忘词主动再练。</p>}<Button size="lg" onClick={onNext}>接着练阅读 <ArrowRight size={18} /></Button></> : <><h3>从一小轮开始</h3><p>到期词优先，用新词补足这一轮。先在脑中说出含义，看释义后如实选择，不用急着把所有词刷完。</p></>}
      <div className={styles.options} aria-label="每轮词数">{[10,20].map(n => <Button key={n} variant={limit === n ? "primary" : "outline"} aria-pressed={limit === n} disabled={disabled} onClick={() => setLimit(n)}>每轮 {n} 词</Button>)}</div>
      <div className={styles.actions}>
        <Button size="lg" disabled={disabled || preview.total === 0} onClick={() => void start()}>开始{finished ? "下一轮" : "学习"} · {preview.total} 词</Button>
        <Button variant="outline" disabled={disabled || due === 0} onClick={() => void start("review")}>只复习到期词</Button>
        <Button variant="outline" disabled={disabled || weak.length === 0} onClick={() => void start("weak")}>易忘词专练 · {weak.length}</Button>
      </div>
      {!preview.total && <p>到期词已复习完，暂时没有新词。休息一下或继续阅读，记住的词会在到期后回来。</p>}
    </div>}
    {session && !finished && (paused ? <div className={styles.setup}><h3>已暂停，进度已保存</h3><p>还有 {session.queue.length} 个词。回来时会从当前词继续。</p><Button onClick={() => setPaused(false)}><Play size={18}/>继续这一轮</Button></div> : current ? <>
      <div className={styles.row}><span>本轮已处理 {session.total-session.queue.length} / {session.total} · 待练 {session.queue.length}</span><Button size="sm" variant="ghost" disabled={disabled} onClick={() => setPaused(true)}><Pause size={16}/>暂停</Button></div>
      <div className={styles.progress} role="progressbar" aria-label="本轮进度" aria-valuemin={0} aria-valuemax={session.total} aria-valuenow={session.total-session.queue.length}><i style={{width: ((session.total-session.queue.length)/session.total*100)+"%"}}/></div>
      <div className={styles.card}>
        <span className={styles.badge}>{session.missed.includes(current.word) ? "再次回忆" : state.words[current.word] ? "复习词" : "新词"}</span>
        <h3>{current.word}</h3><div className={styles.pronunciation}><span>{current.phonetic}</span><Button variant="ghost" size="sm" aria-label={"朗读 "+current.word} onClick={() => speak(current.word)}><Volume2 size={18}/>听发音</Button></div>
        {!revealed ? <div className={styles.prompt}><strong>这个词是什么意思？</strong><p>先自己回忆，再点下方查看。完全想不起来也没关系。</p></div> : <div className={styles.answer}>
          <strong>{current.meaning}</strong><p>常用搭配 · {current.collocation}</p>
          <p className={styles.example}>{current.example}</p>
          <div className={styles.actions}><Button variant="ghost" size="sm" onClick={() => speak(current.example)}><Volume2 size={16}/>听例句</Button><Button variant="ghost" size="sm" onClick={() => setShowTranslation(v => !v)}>{showTranslation ? "隐藏中文" : "查看例句中文"}</Button></div>
          {showTranslation && <p>{current.translation}</p>}<p className={styles.note}>{current.note}</p>
        </div>}
      </div>
      <div className={styles.grading}>
        {!revealed ? <Button size="lg" disabled={disabled} onClick={() => setRevealed(true)}>查看释义</Button> : <>
          <Button size="lg" variant="outline" disabled={disabled} onClick={() => void grade(false)}><RotateCcw size={18}/>没记住</Button>
          <Button size="lg" disabled={disabled} onClick={() => void grade(true)}><Check size={18}/>记住了</Button>
        </>}
      </div>
      <p className={styles.hint}>{revealed ? "看答案前没想起来，就选「没记住」。隔几张再见；本轮连忘 3 次则暂存，避免卡住。" : "快捷键：空格查看释义；1 没记住，2 记住了。"}</p>
    </> : <p role="alert">当前词卡不在词库中，请重新打开页面加载最新词库。</p>)}
    <details className={styles.details}><summary>复习规则与词库说明</summary><p>记住后按 1 天、3 天及逐步延长的间隔复习；忘记则缩短间隔。本轮中的重现是短时巩固，不代表已经长期掌握。</p><p>当前提供 {wordBank.length} 个精选基础核心词，包含释义、搭配、原创例句与译文。这是起步词库，尚未覆盖完整四级词汇，也不是历年真题频次排名。</p></details>
  </section>;
}

