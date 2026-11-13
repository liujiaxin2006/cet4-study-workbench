import type { StudyState } from "../endpoints/study-progress_GET.schema";

type Card = { word: string; meaning: string };
import {learningPlan} from "./learningPlan";
type Session = NonNullable<StudyState["vocabularySession"]>;
function start(state: StudyState, cards: Card[], date: string, limit: number, now = Date.now(), reviewOnly = false): Session {
  const due = cards.filter(c => state.words[c.word] && Date.parse(state.words[c.word].dueAt) <= now)
    .sort((a, b) => Date.parse(state.words[a.word].dueAt) - Date.parse(state.words[b.word].dueAt));
  const fresh = reviewOnly ? [] : cards.filter(c => !state.words[c.word]);
  const queue = [...due, ...fresh].slice(0, limit).map(c => c.word);
  return { date, startedAt: new Date(now).toISOString(), queue, total: queue.length, missed: [], deferred: [], attempts: {} };
}
function grade(state: StudyState, card: Card, remembered: boolean, now = Date.now()): StudyState {
  const session = state.vocabularySession;
  if (!session || session.queue[0] !== card.word) throw new Error("词卡已变化，请重新查看。");
  const prior = state.words[card.word];
  const attempts = (session.attempts[card.word] ?? 0) + 1;
  const queue = session.queue.slice(1);
  const deferred = [...session.deferred];
  if (!remembered) {
    if (attempts >= 3) deferred.push(card.word);
    else queue.splice(Math.min(3, queue.length), 0, card.word);
  }
  const priorDay=prior?.lastReviewedAt?learningPlan.dateKey(new Date(prior.lastReviewedAt)):null;
  const delayed=!!prior&&Date.parse(prior.dueAt)<=now&&priorDay!==learningPlan.dateKey(new Date(now));
  const repetitions=remembered?Math.min(100,prior?(prior.repetitions+(delayed?1:0)):1):0;
  const delayedSuccesses=remembered?Math.min(100,(prior?.delayedSuccesses||0)+(delayed?1:0)):0;
  const intervalDays=remembered?(repetitions<=1?1:repetitions===2?3:Math.min(90,Math.max(1,delayed?(prior?.intervalDays||1)*2:(prior?.intervalDays||1)))):0;
  const mistakes=state.mistakes.map(m=>m.area==="vocabulary"&&m.prompt===card.word?{...m,resolved:remembered&&delayedSuccesses>=2,lastReviewedAt:new Date(now).toISOString(),dueAt:new Date(now+(remembered?intervalDays*86400000:600000)).toISOString()}:m);
  if (!remembered && !mistakes.some(m => m.area === "vocabulary" && m.prompt === card.word)) {
    // Keep outstanding errors when the notebook is full; no duplicate rows for the same word.
    if (mistakes.length >= 500) {
      const resolved = mistakes.findIndex(m => m.resolved);
      if (resolved >= 0) mistakes.splice(resolved, 1);
    }
    if (mistakes.length < 500) mistakes.push({ id: "word-" + card.word + "-" + now, area: "vocabulary", prompt: card.word, note: "复习词义：" + card.meaning, createdAt: new Date(now).toISOString(), resolved: false });
  }
  return { ...state,
    vocabularySession: { ...session, queue, missed: [...new Set([...session.missed, ...(!remembered ? [card.word] : [])])], deferred, attempts: { ...session.attempts, [card.word]: attempts } },
    words: { ...state.words, [card.word]: { repetitions, intervalDays, dueAt: new Date(now + (remembered ? intervalDays * 86400000 : 10 * 60000)).toISOString(), lastResult: remembered ? "remembered" : "again",lastReviewedAt:new Date(now).toISOString(),delayedSuccesses,history:[...(prior?.history||[]),{at:new Date(now).toISOString(),remembered,delayed,intervalDays}].slice(-20) } },
    mistakes
  };
}
export const vocabularyPractice = { start, grade };

