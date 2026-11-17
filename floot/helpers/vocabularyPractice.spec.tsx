import React, { useState } from "react";
import { render, fireEvent, screen, waitFor, cleanup } from "@testing-library/react";
import { vocabularyPractice } from "./vocabularyPractice";
import {wordBank} from "./wordBank";
import { VocabularyPractice } from "../components/VocabularyPractice";
import { studyStateSchema, StudyState } from "../endpoints/study-progress_GET.schema";

const now = Date.parse("2026-10-13T02:00:00Z");
const cards = ["alpha", "beta", "gamma", "delta", "epsilon"].map(word => ({ word, meaning: "测试" }));
function empty(): StudyState { return { version: 1, minutes: 0, daily: {}, words: {}, mistakes: [] }; }
function withSession(): StudyState { const state = empty(); return { ...state, vocabularySession: vocabularyPractice.start(state, cards, "2026-10-13", 10, now) }; }
describe("词汇复习的真实学习边界", () => {
  it("兼容旧进度，不要求迁移账号", () => { expect(studyStateSchema.safeParse(empty()).success).toBeTrue(); });
  it("优先到期词，不把未到期词混入队列", () => {
    const s = empty();
    s.words.beta = { repetitions: 1, intervalDays: 1, dueAt: new Date(now-1000).toISOString(), lastResult: "remembered" };
    s.words.alpha = { repetitions: 2, intervalDays: 3, dueAt: new Date(now+86400000).toISOString(), lastResult: "remembered" };
    const session = vocabularyPractice.start(s, cards, "2026-10-13", 3, now);
    expect(session.queue).toEqual(["beta","gamma","delta"]);
  });
  it("遗忘词间隔三张重现，不重新排序其他卡", () => {
    const next = vocabularyPractice.grade(withSession(), cards[0], false, now);
    expect(next.vocabularySession?.queue).toEqual(["beta","gamma","delta","alpha","epsilon"]);
    expect(next.words.alpha.lastResult).toBe("again");
  });
  it("记住安排隔天，完成后队列为空而非无限循环", () => {
    let s = withSession();
    for (const c of cards) s = vocabularyPractice.grade(s,c,true,now);
    expect(s.vocabularySession?.queue.length).toBe(0);
    expect(Date.parse(s.words.alpha.dueAt)-now).toBe(86400000);
  });
  it("反复遗忘最多三次暂存，不重复塞满错题本", () => {
    let s=empty(); s.vocabularySession=vocabularyPractice.start(s,[cards[0]],"2026-10-13",10,now);
    for(let i=0;i<3;i++) s=vocabularyPractice.grade(s,cards[0],false,now);
    expect(s.vocabularySession?.queue).toEqual([]);
    expect(s.vocabularySession?.deferred).toEqual(["alpha"]);
    expect(s.mistakes.length).toBe(1);
    expect(studyStateSchema.safeParse(s).success).toBeTrue();
  });
  it("忘记后本轮想起，重新从一天开始而非沿用长间隔", () => {
    let s=empty();
    s.words.alpha={repetitions:8,intervalDays:90,dueAt:new Date(now-1000).toISOString(),lastResult:"remembered"};
    s.vocabularySession=vocabularyPractice.start(s,[cards[0]],"2026-10-13",10,now);
    s=vocabularyPractice.grade(s,cards[0],false,now);
    s=vocabularyPractice.grade(s,cards[0],true,now);
    expect(s.words.alpha.intervalDays).toBe(1);
    expect(s.mistakes[0].resolved).toBeFalse();
  });
  it("同一天再次想起不延长间隔，也不伪造跨天复习",()=>{
    let s=empty();s.vocabularySession=vocabularyPractice.start(s,[cards[0]],"2026-10-13",10,now);
    s=vocabularyPractice.grade(s,cards[0],true,now);
    s.vocabularySession=vocabularyPractice.start({...s,words:{}},[cards[0]],"2026-10-13",10,now);
    s=vocabularyPractice.grade(s,cards[0],true,now+1000);
    expect(s.words.alpha.intervalDays).toBe(1);expect(s.words.alpha.delayedSuccesses).toBe(0);
  });
  it("保持其他学习记录，并可序列化恢复未完成的一轮", () => {
    const s=withSession(); s.minutes=35;
    s.daily["2026-10-12"]={minutes:35,completed:["reading","listening"],correct:1,answered:1,updatedAt:new Date(now).toISOString()};
    const next=vocabularyPractice.grade(s,cards[0],false,now);
    const restored=studyStateSchema.parse(JSON.parse(JSON.stringify(next)));
    expect(restored.minutes).toBe(35);
    expect(restored.daily).toEqual(s.daily);
    expect(restored.vocabularySession?.queue[0]).toBe("beta");
  });
  it("拒绝对已被其他设备切走的卡片打分", () => {
    expect(() => vocabularyPractice.grade(withSession(),cards[1],true,now)).toThrow();
  });
});
  function Harness({ fail=false }: { fail?: boolean }) {
    const init=empty();
    init.vocabularySession={date:"2026-10-13",startedAt:new Date(now).toISOString(),queue:["evidence"],total:1,missed:[],deferred:[],attempts:{}};
    const [state,setState]=useState(init);
    return <VocabularyPractice state={state} today="2026-10-13" saving={false} onNext={()=>{}} onSave={async s=>{ if(fail) throw new Error("测试断网"); setState(s); }}/>;
  }

describe("词卡操作流程", () => {
  afterEach(cleanup);
  it("先隐藏答案，翻卡才允许自评，记住后结束", async () => {
    render(<Harness/>);
    expect(screen.queryByText("证据；证明")).toBeNull();
    expect(screen.queryByRole("button",{name:"独立想起"})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    expect(screen.getByText("证据；证明")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"独立想起"}));
    await screen.findByText("这一轮完成了");
  });
  it("保存失败保留答案和当前词，不假装进入下一张", async () => {
    render(<Harness fail/>);
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    fireEvent.click(screen.getByRole("button",{name:"独立想起"}));
    await screen.findByRole("alert");
    expect(screen.getByText("evidence")).toBeTruthy();
    expect(screen.getByText("证据；证明")).toBeTruthy();
    expect(screen.queryByText("这一轮完成了")).toBeNull();
  });
  it("只剩一个遗忘词时重现也必须重新翻卡", async () => {
    render(<Harness/>);
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    fireEvent.click(screen.getByRole("button",{name:"没想起"}));
    await screen.findByRole("button",{name:"查看释义"});
    expect(screen.queryByText("证据；证明")).toBeNull();
  });
});


function FastHarness({fail=false}:{fail?:boolean}){
 const [s,setS]=useState(()=>{const init=empty();init.vocabularySession=vocabularyPractice.start(init,wordBank.slice(0,3),"2026-10-13",3,now);return init;});
 return <VocabularyPractice state={s} today="2026-10-13" saving={true} onNext={()=>{}} onSave={()=>new Promise(()=>{})} onSaveLocal={next=>{if(fail)throw Error("local storage full");setS(next);}}/>;
}
describe("instant word transitions with durable background sync",()=>{
 afterEach(cleanup);
 it("advances and permits revealing the next word while the network is still pending",()=>{
  const view=render(<FastHarness/>);fireEvent.click(view.getByRole("button",{name:"查看释义"}));fireEvent.click(view.getByRole("button",{name:"独立想起"}));
  expect(view.getByText(wordBank[1].word)).toBeTruthy();expect(view.getByRole("button",{name:"查看释义"}).hasAttribute("disabled")).toBeFalse();expect(view.queryByRole("button",{name:"独立想起"})).toBeNull();
 });
 it("does not move past a word if the local safety copy cannot be written",()=>{
  const view=render(<FastHarness fail/>);fireEvent.click(view.getByRole("button",{name:"查看释义"}));fireEvent.click(view.getByRole("button",{name:"没想起"}));
  expect(view.getByText(wordBank[0].word)).toBeTruthy();
 });
});

describe('daily word learning boundaries',()=>{
 it('adds at most five new words per chunk and stops at the daily target',()=>{const s=empty();s.preferences={examDate:'2026-12-12',dailyMinutes:60,focus:'auto',dailyNewWords:10};s.vocabularyDaily={'2026-10-13':{newWords:['a','b','c','d','e','f','g','h','i','j'],reviewedWords:[],independent:10,forgotten:0,hesitant:0,delayedAttempts:0,delayedIndependent:0}};expect(vocabularyPractice.start(s,cards,'2026-10-13',10,now).queue).toEqual([]);});
 it('counts repeated cards once and preserves the failure limit across restarted rounds',()=>{let s=empty();s.vocabularySession=vocabularyPractice.start(s,[cards[0]],'2026-10-13',10,now);for(let n=0;n<3;n++)s=vocabularyPractice.grade(s,cards[0],'hesitant',now);expect(s.vocabularyDaily?.['2026-10-13'].newWords).toEqual(['alpha']);expect(s.vocabularyDaily?.['2026-10-13'].hesitant).toBe(3);s.vocabularySession=vocabularyPractice.start(s,[cards[0]],'2026-10-13',10,now+60000,true,true);expect(s.vocabularySession.queue).toEqual([]);expect(studyStateSchema.safeParse(s).success).toBeTrue();});
 it('caps default due work but allows an explicit extra review',()=>{const s=empty();for(const c of cards)s.words[c.word]={repetitions:1,intervalDays:1,dueAt:new Date(now-1000).toISOString(),lastResult:'again'};s.vocabularyDaily={'2026-10-13':{newWords:[],reviewedWords:Array.from({length:20},(_,i)=>'old'+i),independent:20,forgotten:0,hesitant:0,delayedAttempts:0,delayedIndependent:0}};expect(vocabularyPractice.start(s,cards,'2026-10-13',10,now).queue).toEqual([]);expect(vocabularyPractice.start(s,cards,'2026-10-13',10,now,true,true).queue.length).toBe(5);});
});
