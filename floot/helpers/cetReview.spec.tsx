import { cetReview,ReviewError,type ReviewPaper } from './cetReview';
const paper:ReviewPaper={id:'p',title:'sample',version:1,status:'admin-review',exam:'2023.06',objectiveCount:3,subjectiveCount:1,sources:[],reviewNotes:[],groups:[
 {id:'read',kind:'reading',title:'read',sourcePages:[1],paragraphs:[{label:'1',text:'A passage.'}],note:'',questions:[{number:46,prompt:'q',choices:{A:'a',B:'b'},answer:'B',analysis:{kind:'detail',evidence:'A passage.',explanation:'Because.',action:'Read.'}}]},
 {id:'cloze',kind:'cloze',title:'cloze',sourcePages:[2],paragraphs:[],note:'',questions:[{number:26,prompt:'q',choices:{A:'one',B:'two'},answer:'A'},{number:27,prompt:'q',choices:{A:'one',B:'two'},answer:'B'}]},
 {id:'write',kind:'writing',title:'writing',sourcePages:[3],paragraphs:[],note:'',questions:[],task:'Write.',reference:'PRIVATE REFERENCE',rubric:['Check.']}
]};
describe('private CET review workflow',()=>{
 it('does not send answers, analysis or model references before submission',()=>{
  const visible=cetReview.publicPaper(paper,cetReview.empty());
  expect(JSON.stringify(visible)).not.toContain('"answer":');
  expect(JSON.stringify(visible)).not.toContain('"analysis":');
  expect(JSON.stringify(visible)).not.toContain('PRIVATE REFERENCE');
 });
 it('reveals only the submitted group and scores from the stored answer key',()=>{
  const next=cetReview.apply(paper,cetReview.empty(),{groupId:'read',revision:0,action:'submit',answers:{'46':'A'},text:''});
  const visible=cetReview.publicPaper(paper,next);
  expect(visible.groups[0].questions[0].answer).toBe('B');
  expect(visible.groups[1].questions[0].answer).toBeUndefined();
  expect(visible.groups[2].reference).toBeUndefined();
  expect(cetReview.score(visible.groups[0],next.answers)).toEqual({total:1,correct:0});
 });
 it('keeps partial drafts but refuses incomplete submission',()=>{
  const command={groupId:'cloze',revision:0,action:'save' as const,answers:{'26':'A'},text:''};
  expect(cetReview.apply(paper,cetReview.empty(),command).answers).toEqual({'26':'A'});
  expect(()=>cetReview.apply(paper,cetReview.empty(),{...command,action:'submit'})).toThrowError(ReviewError);
 });
 it('rejects cross-group answers, unknown options and repeated cloze choices',()=>{
  const base={groupId:'cloze',revision:0,action:'submit' as const,text:''};
  for(const answers of [{'46':'B'},{'26':'Z','27':'B'},{'26':'A','27':'A'}])expect(()=>cetReview.apply(paper,cetReview.empty(),{...base,answers})).toThrowError(ReviewError);
 });
 it('detects stale writes before overwriting a newer device revision',()=>{
  const command={groupId:'read',revision:0,action:'save' as const,answers:{'46':'A'},text:''};
  const saved=cetReview.apply(paper,cetReview.empty(),command);
  try{cetReview.apply(paper,saved,command);fail('stale write accepted');}catch(e){expect((e as ReviewError).status).toBe(409);}
 });
 it('requires a restart to change submitted answers and preserves other groups',()=>{
  const first=cetReview.apply(paper,cetReview.empty(),{groupId:'read',revision:0,action:'submit',answers:{'46':'B'},text:''});
  expect(()=>cetReview.apply(paper,first,{groupId:'read',revision:1,action:'save',answers:{'46':'A'},text:''})).toThrowError();
  const withDraft=cetReview.apply(paper,first,{groupId:'cloze',revision:1,action:'save',answers:{'26':'A'},text:''});
  const reset=cetReview.apply(paper,withDraft,{groupId:'read',revision:2,action:'restart',answers:{},text:''});
  expect(reset.answers).toEqual({'26':'A'});expect(reset.submittedGroups).toEqual([]);
 });
 it('checks writing length, then reveals a reference without inventing an exam score',()=>{
  const base={groupId:'write',revision:0,action:'submit' as const,answers:{}};
  expect(()=>cetReview.apply(paper,cetReview.empty(),{...base,text:'Too short.'})).toThrowError();
  const saved=cetReview.apply(paper,cetReview.empty(),{...base,text:Array(120).fill('word').join(' ')});
  expect(cetReview.publicPaper(paper,saved).groups[2].reference).toBe('PRIVATE REFERENCE');
  expect(cetReview.score(paper.groups[2],saved.answers)).toEqual({correct:0,total:0});
 });
});
