"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VocabularyPractice } from "../components/VocabularyPractice";
import { wordBank as wordSet } from "../helpers/wordBank";
import { Helmet } from "react-helmet";
import { BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Flame, Headphones, Leaf, ListChecks, LogOut, PenLine, RotateCcw, Sparkles, Target, Volume2 } from "lucide-react";
import { Button } from "../components/Button";
import { Textarea } from "../components/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { useAuth } from "../helpers/useAuth";
import { StudyState } from "../endpoints/study-progress_GET.schema";
import { useStudyProgress } from "../helpers/useStudyProgress";
import styles from "./_index.module.css";



const plan = [
  { id: "vocabulary", title: "词汇主动回忆", detail: "到期词优先，再学新词", time: 20, icon: Sparkles, tab: "words" },
  { id: "reading", title: "阅读精练", detail: "主旨题与段落证据定位", time: 20, icon: BookOpen, tab: "reading" },
  { id: "listening", title: "听力跟读", detail: "短对话：先听关键词", time: 15, icon: Headphones, tab: "listening" },
  { id: "writing", title: "翻译 / 写作", detail: "写 2 句并检查主谓", time: 5, icon: PenLine, tab: "writing" },
];

function shanghaiDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function emptyDay(): StudyState["daily"][string] {
  return { minutes: 0, completed: [] as string[], correct: 0, answered: 0, updatedAt: new Date().toISOString() };
}

export default function HomePage() {
  const { authState, logout } = useAuth();
  const { state, save, saveAsync, isLoading, isError, refetch, saving, saveError } = useStudyProgress();
  const [activeTab, setActiveTab] = useState("today");
  const [clock, setClock] = useState(Date.now());
  const [audioError, setAudioError] = useState("");
  const [played, setPlayed] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [translation, setTranslation] = useState("");
  const draftDirty = useRef(false);
  useEffect(() => { draftDirty.current = false; }, [shanghaiDateKey()]);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const today = shanghaiDateKey();
  const daily = state.daily[today] ?? emptyDay();
  const showExplanation = daily.readingChoice !== undefined;
  const nextTask = plan.find(item => !daily.completed.includes(item.id));
  useEffect(() => { const id = window.setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { setSelectedAnswer(null); setShowTranscript(false); setPlayed(false); setShowModelAnswer(false); setDraftNotice(""); }, [today]);
  useEffect(() => { if (!draftDirty.current) setTranslation(daily.translation ?? ""); }, [today, daily.translation]);
  useEffect(() => { if (activeTab !== "listening" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, [activeTab]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const dueWords = useMemo(() => wordSet.filter(item => state.words[item.word] && new Date(state.words[item.word].dueAt).getTime() <= clock).length, [state.words, clock]);
  const freshWords = wordSet.filter(item => !state.words[item.word]).length;
  const weekAccuracy = useMemo(() => {
    const cutoff = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const recent = Object.entries(state.daily).filter(([date]) => date >= cutoff);
    const answered = recent.reduce((sum, [, item]) => sum + item.answered, 0);
    const correct = recent.reduce((sum, [, item]) => sum + item.correct, 0);
    return answered ? `${Math.round((correct / answered) * 100)}%` : "—";
  }, [state.daily]);

  const saveNext = (next: StudyState) => save(next);
  const recordTask = async (taskId: string, minutes: number) => {
    const current = state.daily[today] ?? emptyDay();
    if (current.completed.includes(taskId)) return;
    const nextDay = { ...current, minutes: Math.min(60, current.minutes + minutes), completed: [...current.completed, taskId], updatedAt: new Date().toISOString() };
    try {
      await saveAsync({ ...state, minutes: state.minutes + (nextDay.minutes-current.minutes), daily: { ...state.daily, [today]: { ...nextDay, ...(taskId === "writing" ? { translation } : {}) } } });
      const following = plan.find(item => !nextDay.completed.includes(item.id));
      setActiveTab(following?.tab ?? "review");
    } catch { /* Save error is displayed; do not navigate away. */ }
  };

  const resolveMistake = (id: string) => {
    saveNext({ ...state, mistakes: state.mistakes.map((item) => item.id === id ? { ...item, resolved: true } : item) });
  };

  const submitReading = async () => {
    if (selectedAnswer === null || showExplanation || saving) return;
    const correct = selectedAnswer === 1;
    const current = state.daily[today] ?? emptyDay();
    const nextDay = { ...current, readingChoice: selectedAnswer, answered: current.answered + 1, correct: current.correct + (correct ? 1 : 0), updatedAt: new Date().toISOString() };
    const prompt = "Why can daily short study sessions be helpful?";
    const mistakes = correct || state.mistakes.some(item => item.prompt === prompt && !item.resolved) ? state.mistakes : [...state.mistakes, { id: `reading-${Date.now()}`, area: "reading" as const, prompt, note: "正确答案 B。原文证据：small, repeated actions can be easier to maintain。A 的 guarantee 过于绝对，C/D 原文未支持。", createdAt: new Date().toISOString(), resolved: false }].slice(-500);
    try { await saveAsync({ ...state, daily: { ...state.daily, [today]: nextDay }, mistakes }); } catch {}
  };
  const saveDraft = async () => {
    try { await saveAsync({ ...state, daily: { ...state.daily, [today]: { ...daily, translation, updatedAt: new Date().toISOString() } } }); draftDirty.current = false; setDraftNotice("草稿已保存，可换设备继续。"); } catch { setDraftNotice("草稿保存失败，文字仍在当前输入框，请重试。"); }
  };

  const speakSentence = () => {
    if (!("speechSynthesis" in window)) { setAudioError("当前浏览器不支持朗读，请使用系统浏览器。"); return; }
    setAudioError("");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("The manager postponed the meeting because several important documents were missing.");
    utterance.lang = "en-US";
    utterance.rate = 0.84;
    utterance.onend = () => setPlayed(true);
    utterance.onerror = event => { if (event.error !== "interrupted" && event.error !== "canceled") setAudioError("播放失败，请检查音量或换用系统浏览器。"); };
    window.speechSynthesis.speak(utterance);
  };

  const completed = (id: string) => daily.completed.includes(id);
  const examDays = Math.max(0, Math.ceil((Date.UTC(2026, 11, 12) - Date.now()) / 86400000));
  const greeting = authState.type === "authenticated" ? authState.user.displayName : "同学";

  if (isLoading) return <main className={styles.loading}>正在读取你的学习进度…</main>;
  if (isError) return <main className={styles.loading}><div><p>云端进度暂时读取失败，请联网后重试。</p><Button onClick={() => void refetch()}>重新读取进度</Button></div></main>;

  return (
    <main className={styles.app}>
      <Helmet><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#275c46" /><link rel="manifest" href="/manifest.json" /></Helmet>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="四级上岸首页"><span className={styles.brandMark}><Leaf size={18} /></span><span>四级上岸</span></a>
        <div className={styles.topActions}><span className={styles.userName}>{greeting}</span><Button variant="ghost" size="sm" onClick={() => void logout()}><LogOut size={15} /> 退出</Button></div>
      </header>

      <div className={styles.shell}>
        {activeTab === "today" && <>
        <section className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>2026 CET-4 · 目标 470</p>
            <h1>把今天学扎实。</h1>
            <p className={styles.subheading}>每天 60 分钟，先练单词和阅读。按计划走，进步看得见。早晚提醒仍在本聊天中发送。</p>
          </div>
          <div className={styles.examCard}><span>距离考试</span><strong>{examDays} <small>天</small></strong><span>2026 年 12 月 12 日</span></div>
        </section>

        <section className={styles.stats} aria-label="学习概况">
          <div className={styles.stat}><span className={styles.statIcon}><Clock3 size={18} /></span><span className={styles.statLabel}>已记录时长</span><strong>{daily.minutes} <small>/ 60 分钟</small></strong><div className={styles.meter}><i style={{ width: `${Math.min(100, Math.round(daily.minutes / 60 * 100))}%` }} /></div></div>
          <div className={styles.stat}><span className={styles.statIcon}><RotateCcw size={18} /></span><span className={styles.statLabel}>待复习词</span><strong>{dueWords}<small> 个到期词</small></strong><span className={styles.statHint}>另有 {freshWords} 个未学词</span></div>
          <div className={styles.stat}><span className={styles.statIcon}><Target size={18} /></span><span className={styles.statLabel}>近 7 天阅读正确率</span><strong>{weekAccuracy}</strong><span className={styles.statHint}>按已完成练习计算</span></div>
        </section>
        </>}

        {saveError && <p role="alert" className={styles.saveError}>{saveError.message} 请核对当前云端进度后重试；未保存的操作不会记作完成。</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
          <TabsList className={styles.tabList}>
            <TabsTrigger value="today">今日计划</TabsTrigger><TabsTrigger value="words">词汇复习</TabsTrigger><TabsTrigger value="reading">阅读训练</TabsTrigger><TabsTrigger value="listening">听力练习</TabsTrigger><TabsTrigger value="writing">翻译写作</TabsTrigger><TabsTrigger value="review">错题复盘</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>TODAY'S ROUTINE</p><h2>今天的 60 分钟</h2></div><span className={styles.datePill}>{daily.completed.length} / 4 项已记录</span></div>
            <div className={styles.todayGrid}>
              <div className={styles.planList}>
                {plan.map((item, index) => {
                  const Icon = item.icon;
                  return <Button variant="ghost" className={styles.planRow} key={item.id} onClick={() => setActiveTab(item.tab)}>
                    <span className={styles.planNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.planIcon}><Icon size={19} /></span>
                    <span className={styles.planText}><strong>{item.title}</strong><small>{completed(item.id) ? "已记录完成" : item.detail}</small></span><span className={styles.planTime}>{item.time} 分钟</span>{completed(item.id) ? <CheckCircle2 size={17} className={styles.doneIcon} /> : <ChevronRight size={17} className={styles.chevron} />}
                  </Button>;
                })}
              </div>
              <aside className={styles.tipCard}><span className={styles.tipIcon}><Sparkles size={18} /></span><p className={styles.eyebrow}>老师提醒</p><h3>别急着看答案</h3><p>先遮住中文释义，用自己的话回忆。想不起来再翻卡片，这样比反复默读更牢。</p><Button size="lg" onClick={() => setActiveTab(nextTask?.tab ?? "review")}>{nextTask ? `继续：${nextTask.title}` : "今日计划完成，去复盘"} <ChevronRight size={17} /></Button></aside>
            </div>
          </TabsContent>

          <TabsContent value="words" className={styles.content}>
            <VocabularyPractice state={state} today={today} saving={saving} onSave={saveAsync} onNext={() => setActiveTab("reading")} />
            <div className={styles.practiceEnd}><p>每轮词数不等于学习时长。实际学满 20 分钟后再记录。</p><Button variant="outline" disabled={saving || completed("vocabulary") || !state.vocabularySession || state.vocabularySession.date !== today || Object.keys(state.vocabularySession.attempts).length === 0} onClick={() => void recordTask("vocabulary",20)}>{completed("vocabulary") ? "今日词汇时长已记录" : "已学满 20 分钟，记录并继续"}</Button></div>
          </TabsContent>

          <TabsContent value="reading" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>READING · 证据定位</p><h2>短篇阅读练习</h2></div><span className={styles.datePill}>约 8 分钟</span></div>
            <article className={styles.readingCard}>
              <div className={styles.readingLabel}><BookOpen size={16} /> 阅读策略 · 先看题干，再找证据</div>
              <h3>Why small habits matter</h3>
              <p>People often believe that major change requires a dramatic decision. Yet research on learning suggests that small, repeated actions can be easier to maintain. A student who reads for ten minutes every day may build a stronger routine than one who studies for several hours only once a week. The key is not the size of a single effort, but the way it becomes part of daily life.</p>
              <p>Small habits also make progress easier to notice. When learners record what they have done, they can identify which methods help and where they need support. This feedback allows them to adjust their plans instead of giving up after a difficult day.</p>
              <div className={styles.question}><strong>According to the passage, why can daily short study sessions be helpful?</strong>
                {["They guarantee a high score in a short time.", "They are easier to maintain and can form a routine.", "They remove the need to review mistakes.", "They are useful only for advanced learners."].map((answer, index) => <Button variant="outline" size="lg" key={answer} className={`${styles.answerOption} ${(daily.readingChoice ?? selectedAnswer) === index ? styles.selectedOption : ""} ${showExplanation && index === 1 ? styles.correctOption : ""}`} disabled={showExplanation} onClick={() => setSelectedAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{answer}</Button>)}
              </div>
              <div className={styles.readingActions}><Button size="lg" disabled={selectedAnswer === null || showExplanation || saving} onClick={submitReading}>提交答案</Button>{showExplanation && <span className={styles.explanation}><Check size={16} /> 你选了 {String.fromCharCode(65 + (daily.readingChoice ?? 0))}，{daily.readingChoice === 1 ? "答对了" : "本题答错了"}。正确答案 B。证据在第一段 “small, repeated actions can be easier to maintain”。A 的 guarantee 太绝对，C、D 无原文依据。</span>}</div>
              {showExplanation && <Button variant="outline" size="sm" disabled={saving || completed("reading")} onClick={() => recordTask("reading", 20)}>{completed("reading") ? "今日阅读已记录" : "已学满 20 分钟，记录并继续"}</Button>}
            </article>
          </TabsContent>

          <TabsContent value="listening" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>LISTENING · 听关键词</p><h2>短句听力练习</h2></div><span className={styles.datePill}>约 3 分钟</span></div>
            <article className={styles.practiceCard}><span className={styles.practiceIcon}><Headphones size={22} /></span><h3>先听两遍，抓原因</h3><p>问题：Why was the meeting postponed? 先听原因，再展开原文核对。</p><p className={styles.sourceNote}>浏览器合成语音 · 基础听辨练习，不是真题录音。</p>{audioError && <p role="alert" className={styles.saveError}>{audioError}</p>}{showTranscript && <p className={styles.englishSentence}>The manager postponed the meeting because several important documents were missing.</p>}<Button size="lg" onClick={speakSentence}><Volume2 size={18} /> 播放英文</Button><Button variant="outline" size="lg" onClick={() => setShowTranscript((value) => !value)}>{showTranscript ? "隐藏句子" : "显示句子"}</Button>{showTranscript && <div className={styles.transcript}><strong>核对原因</strong><p>Because several important documents were missing.</p><small>几份重要文件缺失，所以会议推迟。留意 postponed（推迟）和 because 后面的原因。</small></div>}<div className={styles.practiceEnd}><p>听完后，先口头说出原因，再打开句子核对。</p><Button variant="secondary" disabled={saving || completed("listening") || !played || !showTranscript} onClick={() => recordTask("listening", 15)}>{completed("listening") ? "今日听力已记录" : "已练满 15 分钟，记录并继续"}</Button></div></article>
          </TabsContent>

          <TabsContent value="writing" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>TRANSLATION · 先自己表达</p><h2>一句话翻译练习</h2></div><span className={styles.datePill}>约 5 分钟</span></div>
            <article className={styles.practiceCard}><span className={styles.practiceIcon}><PenLine size={22} /></span><h3>请把下面这句话译成英文</h3><p className={styles.chinesePrompt}>良好的学习习惯能帮助学生在繁忙的生活中实现长期目标。</p><Textarea value={translation} disabled={saving} maxLength={4000} aria-label="你的英文译文" onChange={(event) => { draftDirty.current = true; setTranslation(event.target.value); setDraftNotice("有未保存的修改"); }} placeholder="在这里写下你的译文…" className={styles.translationInput} /><div className={styles.wordActions}><Button variant="outline" disabled={saving} onClick={() => void saveDraft()}>保存草稿</Button><Button variant="outline" disabled={!translation.trim()} onClick={() => setShowModelAnswer((value) => !value)}>{showModelAnswer ? "收起参考译文" : "查看参考译文"}</Button><Button variant="secondary" disabled={saving || completed("writing") || !translation.trim() || !showModelAnswer} onClick={() => recordTask("writing", 5)}>{completed("writing") ? "今日翻译已记录" : "已练满 5 分钟，记录并继续"}</Button></div><p role="status">{draftNotice}</p>{showModelAnswer && <div className={styles.transcript}><strong>参考译文</strong><p>Good study habits can help students achieve long-term goals in their busy lives.</p><small>检查点：主语 habits 为复数；help 后接动词原形；“实现目标”可用 achieve goals。</small></div>}</article>
          </TabsContent>

          <TabsContent value="review" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ERROR REVIEW</p><h2>把错题变成下一次的得分</h2></div><span className={styles.datePill}>{state.mistakes.filter((item) => !item.resolved).length} 道待复盘</span></div>
            <Button variant="outline" size="sm" onClick={() => setShowResolved(v => !v)}>{showResolved ? "只看待复盘" : "查看全部记录"}</Button>{state.mistakes.filter(item => showResolved || !item.resolved).length === 0 ? <div className={styles.reviewEmpty}><span className={styles.reviewIcon}><ListChecks size={20} /></span><strong>当前没有待复盘内容</strong><p>完成词汇或阅读练习后，答错和记不牢的内容会自动出现在这里。</p></div> : <div className={styles.mistakeList}>{state.mistakes.filter(item => showResolved || !item.resolved).slice().reverse().map((item) => <article className={styles.mistake} key={item.id}><div className={styles.mistakeHeading}><span>{item.area === "vocabulary" ? "词汇" : item.area === "reading" ? "阅读" : "练习"}</span><strong>{item.prompt}</strong></div><p>{item.note}</p>{item.resolved ? <small className={styles.resolvedLabel}>已复盘</small> : <Button variant="outline" size="sm" disabled={saving} onClick={() => resolveMistake(item.id)}>标记已复盘</Button>}</article>)}</div>}
            <div className={styles.reviewCard}><span className={styles.reviewIcon}><Volume2 size={20} /></span><strong>听力练习方法</strong><p>第一遍抓场景和说话人态度，第二遍听转折、数字和原因。每次只复盘一个漏听点。</p><Button variant="outline" onClick={() => setActiveTab("listening")}>去做听力练习</Button></div>
          </TabsContent>
        </Tabs>

        <footer className={styles.footer}><span>{saving ? "正在同步进度…" : saveError ? "上次保存失败，请按提示重试。" : "进度保存在账号中；切回页面或每 30 秒读取其他设备更新。"}</span><span>学习内容以训练为主，不虚构真题频次</span></footer>
      </div>
    </main>
  );
}
