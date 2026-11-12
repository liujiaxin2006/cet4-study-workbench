"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { VocabularyPractice } from "../components/VocabularyPractice";
import { wordBank as wordSet } from "../helpers/wordBank";
import { Helmet } from "react-helmet";
import { BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Flame, Headphones, LayoutDashboard, Leaf, ListChecks, LogOut, PenLine, RotateCcw, Sparkles, Target, Volume2, Grid2X2 } from "lucide-react";
import { Button } from "../components/Button";
import { Textarea } from "../components/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { useAuth } from "../helpers/useAuth";
import { Link } from "react-router-dom";
import { StudyState } from "../endpoints/study-progress_GET.schema";
import { useStudyProgress } from "../helpers/useStudyProgress";
import { ExamCoverage } from "../components/ExamCoverage";
import styles from "./_index.module.css";



const plan = [
  { id: "vocabulary", title: "词汇主动回忆", detail: "到期词优先，再学新词", time: 20, icon: Sparkles, tab: "words" },
  { id: "reading", title: "阅读精练", detail: "主旨题与段落证据定位", time: 20, icon: BookOpen, tab: "reading" },
  { id: "listening", title: "听力跟读", detail: "短对话：先听关键词", time: 15, icon: Headphones, tab: "listening" },
  { id: "writing", title: "翻译 / 写作", detail: "写 2 句并检查主谓", time: 5, icon: PenLine, tab: "writing" },
];

const readingQuestions = [
  {
    prompt: "What is the main idea of the passage?",
    choices: ["Large changes are the only way to improve.", "Small daily habits can support lasting learning.", "Students should study several hours every weekend.", "Progress cannot be measured."],
    answer: 1,
    explanation: "全文强调小而持续的行动更容易坚持，并能帮助学习者调整计划。",
  },
  {
    prompt: "According to the passage, what may a student gain by reading for ten minutes every day?",
    choices: ["A routine that is easier to keep.", "A guarantee of a high score.", "A reason to stop reviewing.", "More free time every day."],
    answer: 0,
    explanation: "第一段举例说明，每天读十分钟可能比每周只学一次几小时更容易形成稳定习惯。",
  },
  {
    prompt: "Why should learners record what they have done?",
    choices: ["To compare their scores with other students.", "To avoid changing their study plans.", "To see which methods help and where they need support.", "To make every study session longer."],
    answer: 2,
    explanation: "第二段指出，记录进度能帮助学习者发现有效方法和需要支持的地方。",
  },
  {
    prompt: "The word “maintain” in Paragraph 1 is closest in meaning to ______.",
    choices: ["continue", "explain", "measure", "replace"],
    answer: 0,
    explanation: "“easier to maintain”意为“更容易维持/坚持”，最接近 continue。",
  },
  {
    prompt: "What did Maya’s teacher advise her to do when her schedule changed?",
    choices: ["Give up their plans immediately.", "Adjust their plans instead of giving up.", "Study only when they feel confident.", "Ignore the methods they have tried."],
    answer: 1,
    explanation: "第三段指出，Maya 的老师建议她在日程变化时调整计划，而不是放弃。",
  },
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
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const mobileTabs = ["today", "words", "reading", "more"] as const;
  const moreActive = ["more", "listening", "writing", "coverage", "review"].includes(activeTab);
  const handleTouchEnd = (event: TouchEvent) => {
    if (!swipeStart.current || !window.matchMedia("(max-width: 740px)").matches) return;
    const dx = event.changedTouches[0].clientX - swipeStart.current.x;
    const dy = event.changedTouches[0].clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    const current = moreActive ? 3 : mobileTabs.indexOf(activeTab as typeof mobileTabs[number]);
    const next = Math.max(0, Math.min(3, current + (dx < 0 ? 1 : -1)));
    if (next !== current) setActiveTab(mobileTabs[next]);
  };
  const [clock, setClock] = useState(Date.now());
  const [audioError, setAudioError] = useState("");
  const [played, setPlayed] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [showTranscript, setShowTranscript] = useState(false);
  const [translation, setTranslation] = useState("");
  const draftDirty = useRef(false);
  useEffect(() => { draftDirty.current = false; }, [shanghaiDateKey()]);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const today = shanghaiDateKey();
  const daily = state.daily[today] ?? emptyDay();
  const showExplanation = daily.readingAnswers !== undefined;
  const nextTask = plan.find(item => !daily.completed.includes(item.id));
  useEffect(() => { const id = window.setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { setSelectedAnswers(Array(5).fill(null)); setShowTranscript(false); setPlayed(false); setShowModelAnswer(false); setDraftNotice(""); }, [today]);
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
    if (selectedAnswers.some((answer) => answer === null) || showExplanation || saving) return;
    const answers = selectedAnswers as number[];
    const correctCount = readingQuestions.reduce((count, question, index) => count + (answers[index] === question.answer ? 1 : 0), 0);
    const current = state.daily[today] ?? emptyDay();
    const nextDay = { ...current, readingAnswers: answers, answered: current.answered + readingQuestions.length, correct: current.correct + correctCount, updatedAt: new Date().toISOString() };
    const newMistakes = readingQuestions.flatMap((question, index) => answers[index] === question.answer || state.mistakes.some((item) => item.prompt === question.prompt && !item.resolved) ? [] : [{ id: `reading-${Date.now()}-${index}`, area: "reading" as const, prompt: question.prompt, note: `正确答案 ${String.fromCharCode(65 + question.answer)}。${question.explanation}`, createdAt: new Date().toISOString(), resolved: false }]);
    const mistakes = [...state.mistakes, ...newMistakes].slice(-500);
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
      <Helmet><title>CET-4 Copilot</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#f8f7ff" /><link rel="manifest" href="/manifest.json" /></Helmet>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="CET-4 Copilot 首页"><span className={styles.brandMark}><Leaf size={18} /></span><span>CET-4 Copilot</span></a>
        <div className={styles.topActions}>{authState.type === "authenticated" && authState.user.role === "admin" && <Link className={styles.adminLink} to="/admin"><LayoutDashboard size={15} /> 数据面板</Link>}<span className={styles.userName}>{greeting}</span><Button variant="ghost" size="sm" onClick={() => void logout()}><LogOut size={15} /> 退出</Button></div>
      </header>

      <div className={styles.shell} onTouchStart={(event) => { swipeStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={handleTouchEnd}>
        {activeTab === "today" && <>
        <section className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>2026 CET-4 · 目标 470</p>
            <h1>今天读一点，进一点。</h1>
            <p className={styles.subheading}>不用一口气学完。先花一点时间记词、读一篇文章，剩下的跟着节奏来。</p>
          </div>
          <div className={styles.examCard}><span>距离考试</span><strong>{examDays} <small>天</small></strong><span>2026 年 12 月 12 日</span></div>
        </section>

        <section className={styles.focusCard} aria-label="下一步学习"><div><span className={styles.focusKicker}>今天的小目标 ✦</span><h2>{nextTask ? nextTask.title : "今天的计划完成了"}</h2><p>{nextTask ? nextTask.detail : "去错题本巩固今天没掌握的内容。"}</p></div><Button size="lg" onClick={() => setActiveTab(nextTask?.tab ?? "review")}>{nextTask ? "现在开始" : "查看错题"} <ChevronRight size={18} /></Button></section><section className={styles.stats} aria-label="学习概况">
          <div className={styles.stat}><span className={styles.statIcon}><Clock3 size={18} /></span><span className={styles.statLabel}>已记录时长</span><strong>{daily.minutes} <small>/ 60 分钟</small></strong><div className={styles.meter}><i style={{ width: `${Math.min(100, Math.round(daily.minutes / 60 * 100))}%` }} /></div></div>
          <div className={styles.stat}><span className={styles.statIcon}><RotateCcw size={18} /></span><span className={styles.statLabel}>待复习词</span><strong>{dueWords}<small> 个到期词</small></strong><span className={styles.statHint}>另有 {freshWords} 个未学词</span></div>
          <div className={styles.stat}><span className={styles.statIcon}><Target size={18} /></span><span className={styles.statLabel}>近 7 天阅读正确率</span><strong>{weekAccuracy}</strong><span className={styles.statHint}>按已完成练习计算</span></div>
        </section>
        </>}

        {saveError && <p role="alert" className={styles.saveError}>{saveError.message} 请核对当前云端进度后重试；未保存的操作不会记作完成。</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
          <TabsList className={styles.tabList}>
            <TabsTrigger value="today">今日</TabsTrigger><TabsTrigger value="words">词汇</TabsTrigger><TabsTrigger value="reading">阅读</TabsTrigger><TabsTrigger value="listening">听力</TabsTrigger><TabsTrigger value="writing">写译</TabsTrigger><TabsTrigger value="coverage">题型地图</TabsTrigger><TabsTrigger value="review">错题</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>TODAY'S ROUTINE</p><h2>今天，慢慢来就好</h2></div><span className={styles.datePill}>{daily.completed.length} / 4 项已记录</span></div>
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
              <aside className={styles.tipCard}><span className={styles.tipIcon}><Sparkles size={18} /></span><p className={styles.eyebrow}>一点小诀窍</p><h3>想一下，再翻卡</h3><p>词汇先想词义再翻卡；阅读先找原文证据再提交。错题会进复盘清单。</p><Button size="lg" onClick={() => setActiveTab(nextTask?.tab ?? "review")}>{nextTask ? `继续：${nextTask.title}` : "今日计划完成，去复盘"} <ChevronRight size={17} /></Button></aside>
            </div>
          </TabsContent>

          <TabsContent value="words" className={styles.content}>
            <VocabularyPractice state={state} today={today} saving={saving} onSave={saveAsync} onNext={() => setActiveTab("reading")} />
            <div className={styles.practiceEnd}><p>每轮词数不等于学习时长。实际学满 20 分钟后再记录。</p><Button variant="outline" disabled={saving || completed("vocabulary") || !state.vocabularySession || state.vocabularySession.date !== today || Object.keys(state.vocabularySession.attempts).length === 0} onClick={() => void recordTask("vocabulary",20)}>{completed("vocabulary") ? "今日词汇时长已记录" : "已学满 20 分钟，记录并继续"}</Button></div>
          </TabsContent>

          <TabsContent value="reading" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>READING · 证据定位</p><h2>短篇阅读练习</h2></div><span className={styles.datePill}>每组 5 题 · 约 15 分钟</span></div>
            <article className={styles.readingCard}>
              <div className={styles.readingLabel}><BookOpen size={16} /> 仔细阅读训练 · 先通读文章，再完成整组题目</div>
              <h3>Why small habits matter</h3>
              <p>Many students assume that improving their English requires long study sessions. They may plan to learn dozens of words and read several articles in one evening. When a busy day makes that plan impossible, they sometimes feel that they have failed and stop studying altogether. A smaller routine can be more practical. Reading for ten minutes after dinner, for example, is easier to fit into a normal day than a four-hour session at the weekend. The goal is not to make every session impressive, but to make learning a regular part of life.</p>
              <p>Maya, a first-year student, learned this after repeatedly postponing her weekend study plan. She began reading a short English article each evening and wrote down one unfamiliar expression. At first, the change seemed too small to matter. After several weeks, however, she had a collection of useful expressions and found it easier to begin reading without waiting for the “perfect” time. She also noticed that certain topics held her attention longer than others.</p>
              <p>Keeping a simple record helped Maya understand what was working. She could see which days were difficult and which study times were realistic. Her teacher suggested that she adjust the plan when her schedule changed, rather than abandon it. Maya later added a few minutes of vocabulary review, but only after the reading habit had become stable. Small actions do not guarantee quick results; they make steady effort easier to maintain.</p>
              <p className={styles.sourceNote}>本组为原创训练材料，按四级仔细阅读每篇 5 题的练习节奏设计，不是历年真题原文。</p>
              {readingQuestions.map((question, questionIndex) => {
                const chosen = daily.readingAnswers?.[questionIndex] ?? selectedAnswers[questionIndex];
                return <div className={styles.question} key={question.prompt}>
                  <strong>第 {questionIndex + 1} 题 · {question.prompt}</strong>
                  {question.choices.map((answer, answerIndex) => <Button variant="outline" size="lg" key={answer} className={`${styles.answerOption} ${chosen === answerIndex ? styles.selectedOption : ""} ${showExplanation && question.answer === answerIndex ? styles.correctOption : ""} ${showExplanation && chosen === answerIndex && chosen !== question.answer ? styles.incorrectOption : ""}`} disabled={showExplanation} onClick={() => setSelectedAnswers((previous) => previous.map((value, index) => index === questionIndex ? answerIndex : value))}><span>{String.fromCharCode(65 + answerIndex)}</span>{answer}</Button>)}
                  {showExplanation && <p className={styles.questionExplanation}><strong>{chosen === question.answer ? "答对" : `答错；正确答案 ${String.fromCharCode(65 + question.answer)}`}</strong>{question.explanation}</p>}
                </div>;
              })}
              <div className={styles.readingActions}><Button size="lg" disabled={selectedAnswers.some((answer) => answer === null) || showExplanation || saving} onClick={submitReading}>{saving ? "正在保存" : "提交整组 5 题"}</Button>{showExplanation && <span className={styles.explanation}><Check size={16} /> 本组得分：{daily.readingAnswers?.reduce((score, answer, index) => score + (answer === readingQuestions[index].answer ? 1 : 0), 0) ?? 0} / 5。错题已加入错题复盘。</span>}</div>
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

          <TabsContent value="coverage" className={styles.content}>
            <ExamCoverage />
          </TabsContent>

          <TabsContent value="more" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MORE TO EXPLORE</p><h2>想练哪一项？</h2></div></div>
            <div className={styles.moreGrid}>
              {([{ tab: "listening", title: "听力跟读", detail: "抓关键词，听出原因", icon: Headphones }, { tab: "writing", title: "写作与翻译", detail: "先动笔，再对照参考表达", icon: PenLine }, { tab: "coverage", title: "四级题型地图", detail: "看看各题型怎么练", icon: Grid2X2 }, { tab: "review", title: "错题复盘", detail: "把不会的再练一遍", icon: ListChecks }] as const).map(({ tab, title, detail, icon: Icon }) => <button type="button" className={styles.moreCard} key={tab} onClick={() => setActiveTab(tab)}><span className={styles.moreIcon}><Icon size={21} /></span><span><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>)}
            </div>
          </TabsContent>

          <TabsContent value="review" className={styles.content}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ERROR REVIEW</p><h2>把错题变成下一次的得分</h2></div><span className={styles.datePill}>{state.mistakes.filter((item) => !item.resolved).length} 道待复盘</span></div>
            <Button variant="outline" size="sm" onClick={() => setShowResolved(v => !v)}>{showResolved ? "只看待复盘" : "查看全部记录"}</Button>{state.mistakes.filter(item => showResolved || !item.resolved).length === 0 ? <div className={styles.reviewEmpty}><span className={styles.reviewIcon}><ListChecks size={20} /></span><strong>当前没有待复盘内容</strong><p>完成词汇或阅读练习后，答错和记不牢的内容会自动出现在这里。</p></div> : <div className={styles.mistakeList}>{state.mistakes.filter(item => showResolved || !item.resolved).slice().reverse().map((item) => <article className={styles.mistake} key={item.id}><div className={styles.mistakeHeading}><span>{item.area === "vocabulary" ? "词汇" : item.area === "reading" ? "阅读" : "练习"}</span><strong>{item.prompt}</strong></div><p>{item.note}</p>{item.resolved ? <small className={styles.resolvedLabel}>已复盘</small> : <Button variant="outline" size="sm" disabled={saving} onClick={() => resolveMistake(item.id)}>标记已复盘</Button>}</article>)}</div>}
            <div className={styles.reviewCard}><span className={styles.reviewIcon}><Volume2 size={20} /></span><strong>听力练习方法</strong><p>第一遍抓场景和说话人态度，第二遍听转折、数字和原因。每次只复盘一个漏听点。</p><Button variant="outline" onClick={() => setActiveTab("listening")}>去做听力练习</Button></div>
          </TabsContent>
        </Tabs>

        <nav className={styles.mobileDock} aria-label="手机端主导航">
          <span className={styles.dockIndicator} style={{ transform: `translateX(${(moreActive ? 3 : Math.max(0, mobileTabs.indexOf(activeTab as typeof mobileTabs[number]))) * 100}%)` }} aria-hidden="true" />
          {([{ tab: "today", label: "今日", icon: Leaf }, { tab: "words", label: "词汇", icon: Sparkles }, { tab: "reading", label: "阅读", icon: BookOpen }, { tab: "more", label: "更多", icon: Grid2X2 }] as const).map(({ tab, label, icon: Icon }) => <button type="button" key={tab} className={styles.dockButton} aria-current={(tab === "more" ? moreActive : activeTab === tab) ? "page" : undefined} onClick={() => setActiveTab(tab)}><Icon size={20} strokeWidth={2} /><span>{label}</span></button>)}
        </nav>

        <footer className={styles.footer}><span>{saving ? "正在同步进度…" : saveError ? "上次保存失败，请按提示重试。" : "进度保存在账号中；切回页面或每 30 秒读取其他设备更新。"}</span><span>学习内容以训练为主，不虚构真题频次</span></footer>
      </div>
    </main>
  );
}
