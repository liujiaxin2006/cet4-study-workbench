import React, { useState } from "react";
import { render, fireEvent, screen, waitFor, cleanup } from "@testing-library/react";
import { vocabularyPractice } from "./vocabularyPractice";
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
    expect(s.mistakes[0].resolved).toBeTrue();
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
    expect(screen.queryByRole("button",{name:"记住了"})).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    expect(screen.getByText("证据；证明")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"记住了"}));
    await screen.findByText("这一轮完成了");
  });
  it("保存失败保留答案和当前词，不假装进入下一张", async () => {
    render(<Harness fail/>);
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    fireEvent.click(screen.getByRole("button",{name:"记住了"}));
    await screen.findByRole("alert");
    expect(screen.getByText("evidence")).toBeTruthy();
    expect(screen.getByText("证据；证明")).toBeTruthy();
    expect(screen.queryByText("这一轮完成了")).toBeNull();
  });
  it("只剩一个遗忘词时重现也必须重新翻卡", async () => {
    render(<Harness/>);
    fireEvent.click(screen.getByRole("button",{name:"查看释义"}));
    fireEvent.click(screen.getByRole("button",{name:"没记住"}));
    await screen.findByRole("button",{name:"查看释义"});
    expect(screen.queryByText("证据；证明")).toBeNull();
  });
});

