export type Analysis = { kind: string; evidence: string; explanation: string; paragraph?: string; options?: Record<string,string>; vocabulary?: string[]; action: string };
export type ReviewQuestion = { number:number; prompt:string; choices:Record<string,string>; answer?:string; analysis?:Analysis };
export type ReviewGroup = { id:string; kind:string; title:string; sourcePages:number[]; paragraphs:{label:string;text:string}[]; questions:ReviewQuestion[]; note:string; task?:string; reference?:string; rubric?:string[]; wordRange?:number[]; audio?:string; audioStatus?:string };
export type ReviewSource = { id:string; path:string; bytes:number; sha256:string; contentType:string };
export type ReviewPaper = { id:string; title:string; version:number; status:string; exam:string; objectiveCount:number; subjectiveCount:number; sources:ReviewSource[]; groups:ReviewGroup[]; reviewNotes:string[] };
export type ReviewAttempt = { revision:number; answers:Record<string,string>; texts:Record<string,string>; submittedGroups:string[] };
export type ReviewCommand = { groupId:string; revision:number; action:'save'|'submit'|'restart'; answers:Record<string,string>; text:string };
export class ReviewError extends Error { constructor(message:string, public status=400){ super(message); } }

export const cetReview = {
  empty():ReviewAttempt { return {revision:0,answers:{},texts:{},submittedGroups:[]}; },
  publicPaper(paper:ReviewPaper,attempt:ReviewAttempt):ReviewPaper {
    return {...paper,groups:paper.groups.map(group=>{
      const {reference,rubric,...base}=group;
      const submitted=attempt.submittedGroups.includes(group.id);
      return {...base,...(submitted?{reference,rubric}:{}),questions:group.questions.map(q=>{
        const {answer,analysis,...publicQuestion}=q;
        return {...publicQuestion,...(submitted?{answer,analysis}:{})};
      })};
    })};
  },
  apply(paper:ReviewPaper,attempt:ReviewAttempt,command:ReviewCommand):ReviewAttempt {
    if(command.revision!==attempt.revision)throw new ReviewError('另一设备已更新，请重新读取后继续。',409);
    const group=paper.groups.find(g=>g.id===command.groupId);
    if(!group)throw new ReviewError('没有找到这组题。');
    if(command.action!=='restart'&&attempt.submittedGroups.includes(group.id))throw new ReviewError('本组已提交；重新练习后才能修改。');
    const validKeys=new Set(group.questions.map(q=>String(q.number)));
    for(const [key,value] of Object.entries(command.answers)) {
      const q=group.questions.find(q=>String(q.number)===key);
      if(!q||!Object.hasOwn(q.choices,value))throw new ReviewError('选项与本组试题不匹配。');
    }
    if(group.questions.length&&command.text)throw new ReviewError('客观题不接受文本草稿。');
    if(command.action==='submit') {
      if(group.questions.some(q=>!command.answers[String(q.number)]))throw new ReviewError('请先完成本组所有题目。');
      if(!group.questions.length&&!command.text.trim())throw new ReviewError('请先写下你的答案。');
      if(group.kind==='cloze'&&new Set(Object.values(command.answers)).size!==Object.values(command.answers).length)throw new ReviewError('选词填空的每个选项最多使用一次。');
      if(group.kind==='writing') {
        const count=(command.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length;
        if(count<120||count>180)throw new ReviewError('请按题目要求写120—180词后再提交。');
      }
    }
    const answers={...attempt.answers};for(const key of validKeys)delete answers[key];
    const texts={...attempt.texts};delete texts[group.id];
    if(command.action!=='restart') { Object.assign(answers,command.answers);if(!group.questions.length)texts[group.id]=command.text; }
    const submittedGroups=attempt.submittedGroups.filter(id=>id!==group.id);
    if(command.action==='submit')submittedGroups.push(group.id);
    return {revision:attempt.revision+1,answers,texts,submittedGroups};
  },
  score(group:ReviewGroup,answers:Record<string,string>) {
    return {total:group.questions.length,correct:group.questions.filter(q=>q.answer&&q.answer===answers[String(q.number)]).length};
  }
};
