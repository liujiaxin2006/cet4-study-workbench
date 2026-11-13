"""Build private, reviewable CET groups from the owner's corpus; never edits originals.

Outputs contain source text and must stay outside the public code repository.
Automatic parsing is NOT approval to publish. Unknown answers remain unknown.
"""
from pathlib import Path
from collections import Counter, defaultdict
import argparse, hashlib, json, re, unicodedata, difflib

CN={'一':'1','二':'2','三':'3'}
EXPECTED={'news':7,'conversation':8,'listening-passage':10,'cloze':10,'matching':10,'reading':5}

def clean(s):
    s=unicodedata.normalize('NFKC',s).replace('\x00','')
    s=re.sub(r'第\s*\d+\s*页[,，]?\s*共\s*\d+\s*页','',s)
    return re.sub(r'\s+',' ',s).strip()

def set_number(path):
    name=Path(path).stem
    if re.search(r'_[23]-[23]',name):return '2-3'
    m=re.search(r'(?:第|卷|真题)\s*([123一二三])\s*(?:套|[)）]|$)',name)
    if not m:m=re.search(r'(?:卷[（(]?|[（(]卷)([123一二三])',name)
    if not m:m=re.search(r'[_（(]([123])[）)]?$',name)
    if not m:m=re.search(r'真题([123])$',name)
    return CN.get(m.group(1),m.group(1)) if m else None

def strip_noise(text):
    lines=[]
    for line in text.splitlines():
        if re.search(r'第\s*\d+\s*页.*共\s*\d+\s*页',line):continue
        if re.match(r'^\s*(?:大学英语四级考试|20\d\d\s*年.*真题|www\.|http)',line):continue
        lines.append(line.rstrip())
    return '\n'.join(lines)

def choices(block,letters='ABCD'):
    # Reconstruct separately printed left and right option columns.
    lines=block.splitlines();found=[]
    for line in lines:
        ms=list(re.finditer(r'(?<![A-Za-z])(['+letters+r'])[)）.．]\s*',line))
        if len(ms)>1:found.append(ms[1].start())
    columns=[block]
    if found:
        split=sorted(found)[len(found)//2]-1
        if split>20:columns=['\n'.join(line[:split] for line in lines),'\n'.join(line[split:] for line in lines)]
    result={}
    for col in columns:
        matches=list(re.finditer(r'(?<![A-Za-z])(['+letters+r'])[)）.．]\s*',col))
        for i,m in enumerate(matches):
            value=clean(col[m.end():matches[i+1].start() if i+1<len(matches) else len(col)])
            if m.group(1) not in result:result[m.group(1)]=value
    return result

def answer_candidates(text):
    result=defaultdict(list)
    # Numbered answer/explanation entries; conflicting readings are not guessed.
    pattern=r'(?<![\dA-Za-z])(\d{1,2})\s*[.、．):：]?\s*(?:[【\[]?\s*(?:答案|参考答案|正确答案)\s*[】\]]?\s*[:：]?\s*)?([A-O])(?=[\s.、。)）\]】]|$)'
    for m in re.finditer(pattern,text):
        n=int(m.group(1))
        if 1<=n<=55:result[n].append(m.group(2))
    grid={};tokens=[]
    def consume(values):
        i=0
        while i<len(values):
            ns=[]
            while i<len(values) and values[i].isdigit():ns.append(int(values[i]));i+=1
            ls=[]
            while i<len(values) and not values[i].isdigit():ls.append(values[i]);i+=1
            if len(ns)>=3 and len(ns)==len(ls) and all(1<=n<=55 for n in ns) and ns==list(range(ns[0],ns[0]+len(ns))):grid.update(zip(ns,ls))
    for line in text.splitlines()+['END']:
        row=line.strip().split()
        if row and all(re.fullmatch(r'(?:\d{1,2}|[A-O])',t) for t in row):tokens.extend(row)
        elif line.strip():consume(tokens);tokens=[]
    return {**{n:values[0] for n,values in result.items() if len(set(values))==1},**grid}

def split_parts(text):
    text=strip_noise(unicodedata.normalize('NFKC',text))
    first={}
    titles={'writing':'writing','listening':'listeningcomprehension','reading':'readingcomprehension','translation':'translation'}
    for m in re.finditer(r'(?m)^.*$',text):
        letters=re.sub('[^a-z]','',m.group(0).lower());letters=re.sub(r'^part[iv]+','',letters)
        for key,title in titles.items():
            if key not in first and ((title in letters and len(letters)<len(title)+18) or (letters.startswith(title[:3]) and difflib.SequenceMatcher(None,letters,title).ratio()>.86)):first[key]=m
    parts={};order=['writing','listening','reading','translation']
    for i,key in enumerate(order):
        if key not in first:continue
        m=first[key];later=[first[k].start() for k in order[i+1:] if k in first and first[k].start()>m.end()]
        parts[key]=text[m.end():min(later) if later else len(text)]
    return parts

def make_group(gid,kind,title,paragraphs,qs,task=None):
    return {'id':gid,'kind':kind,'title':title,'sourcePages':[],'paragraphs':paragraphs,'questions':qs,'note':'自动提取候选，待逐题核对；未确认内容不会计入正式可练题量。',**({'task':task} if task else {}),**({'wordRange':[120,180]} if task and kind=='writing' else {})}

def parse_paper(text,answers):
    parts=split_parts(text);groups=[];issues=[]
    writing=parts.get('writing','')
    writing=re.sub(r'^.*?Directions\s*:', '',writing,flags=re.S).strip()
    if 60<len(clean(writing))<=3000:groups.append(make_group('writing','writing','短文写作',[],[],clean(writing)))
    elif len(clean(writing))>3000:issues.append('writing:section-boundary-needs-review')
    for key,kinds in [('listening',[('news','短篇新闻',1,7),('conversation','长对话',8,15),('listening-passage','听力篇章',16,25)]),('reading',[('reading','仔细阅读一',46,50),('reading','仔细阅读二',51,55)])]:
        section=parts.get(key,'')
        for kind,title,lo,hi in kinds:
            ms=list(re.finditer(r'(?m)^\s*(\d{1,2})\s*[.．、]\s*',section));qs=[]
            for i,m in enumerate(ms):
                n=int(m.group(1))
                if not lo<=n<=hi:continue
                block=section[m.end():ms[i+1].start() if i+1<len(ms) else len(section)]
                block=re.split(r'(?im)^\s*(?:Section\s+[ABC]|Passage\s+(?:One|Two)|Questions?\s+\d|Part\s+)',block)[0]
                options=choices(block);first=re.search(r'(?<![A-Za-z])A[)）.．]',block)
                prompt=clean(block[:first.start()]) if first else ''
                if key=='listening' and not prompt:prompt='听录音中的第'+str(n)+'题后选择答案'
                q={'number':n,'prompt':prompt,'choices':options}
                if n in answers and answers[n] in options:q['answer']=answers[n]
                if not any(old['number']==n for old in qs):qs.append(q)
            if qs:
                paragraphs=[]
                if key=='reading':
                    # Whole passage stays together; never invent a missing passage.
                    start=re.search(r'(?im)^\s*Passage\s+'+('One' if lo==46 else 'Two')+r'\s*$',section)
                    first=re.search(r'(?m)^\s*'+str(lo)+r'\s*[.．、]',section)
                    if start and first and first.start()>start.end():
                        body=section[start.end():first.start()]
                        body=re.sub(r'^\s*Questions?\s+\d+.*?following passage\s*[.．]?','',body,flags=re.I|re.S)
                        paragraphs=[{'label':str(j+1),'text':clean(p)} for j,p in enumerate(re.split(r'\n\s*\n',body)) if len(clean(p))>25]
                gid=kind if key=='listening' else ('reading-one' if lo==46 else 'reading-two')
                groups.append(make_group(gid,kind,title,paragraphs,sorted(qs,key=lambda q:q['number'])))
    reading=parts.get('reading','')
    sections={};ms=list(re.finditer(r'(?im)^\s*Section\s*([ABC])\b',reading))
    for i,m in enumerate(ms):sections[m.group(1)]=reading[m.end():ms[i+1].start() if i+1<len(ms) else len(reading)]
    cloze=sections.get('A','');bank=choices(cloze,'ABCDEFGHIJKLMNO')
    if len(bank)==15:
        first=re.search(r'(?<![A-Za-z])A[)）.．]',cloze)
        body=cloze[:first.start()] if first else cloze
        # Instructions end at "centre."/"center." in the supplied paper formats.
        boundary=list(re.finditer(r'(?:centre|center)\s*\.',body,re.I))
        if boundary:body=body[boundary[-1].end():]
        body=re.sub(r'注意[:：].*?作答[。.]?','',body,flags=re.S)
        body=clean(body)
        qs=[{'number':n,'prompt':'第'+str(n)+'空','choices':bank,**({'answer':answers[n]} if answers.get(n) in bank else {})} for n in range(26,36)]
        groups.append(make_group('cloze','cloze','选词填空',[{'label':'1','text':body}],qs))
    matching=sections.get('B','')
    pms=list(re.finditer(r'(?m)^\s*([A-P])[)）]\s*',matching));paragraphs=[]
    firstq=re.search(r'(?m)^\s*36\s*[.．、]',matching)
    end=firstq.start() if firstq else len(matching)
    pms=[m for m in pms if m.start()<end]
    for i,m in enumerate(pms):paragraphs.append({'label':m.group(1),'text':clean(matching[m.end():pms[i+1].start() if i+1<len(pms) else end])})
    qms=list(re.finditer(r'(?m)^\s*(\d{1,2})\s*[.．、]\s*',matching));qs=[]
    for i,m in enumerate(qms):
        n=int(m.group(1))
        if 36<=n<=45:
            q={'number':n,'prompt':clean(matching[m.end():qms[i+1].start() if i+1<len(qms) else len(matching)]),'choices':{p['label']:'段落'+p['label'] for p in paragraphs}}
            if answers.get(n) in q['choices']:q['answer']=answers[n]
            qs.append(q)
    if qs:groups.append(make_group('matching','matching','长篇匹配',paragraphs,qs))
    translation=parts.get('translation','')
    chinese=re.findall(r'[\u4e00-\u9fff][\u4e00-\u9fff，。；：、“”‘’（）《》\d\sA-Za-z%-]{60,}',translation)
    if chinese:
        task=clean(max(chinese,key=len))
        if len(task)<=3000:groups.append(make_group('translation','translation','段落翻译',[],[],task))
        else:issues.append('translation:section-boundary-needs-review')
    if not parts:issues.append('part-headings-not-recognized')
    for kind in ['writing','translation','news','conversation','listening-passage','cloze','matching','reading']:
        if not any(g['kind']==kind for g in groups):issues.append('missing-or-omitted-in-source:'+kind)
    for g in groups:
        if g['kind'] in EXPECTED and len(g['questions'])!=EXPECTED[g['kind']]:issues.append(g['id']+':incomplete-question-count')
        if g['kind'] in ['cloze','matching','reading'] and not g['paragraphs']:issues.append(g['id']+':missing-passage')
        for q in g['questions']:
            if not q['prompt'] or len(q['prompt'])>500:issues.append(str(q['number'])+':prompt-needs-review')
            if g['kind'] in ['reading','news','conversation','listening-passage'] and set(q['choices'])!=set('ABCD'):issues.append(str(q['number'])+':invalid-options')
            if any(not v or len(v)>300 for v in q['choices'].values()):issues.append(str(q['number'])+':option-text-needs-review')
            if not q.get('answer'):issues.append(str(q['number'])+':answer-unconfirmed')
    return groups,issues

def build(root,inventory,texts,out):
    inv=json.loads(inventory.read_text(encoding='utf8'));out.mkdir(parents=True,exist_ok=True)
    candidates=defaultdict(list)
    for f in inv['files']:
        if f['category']=='paper' and f['extension']=='.pdf':
            number=set_number(f['path'])
            if number:candidates[(f['exam'],number)].append(f)
    papers=[]
    for (exam,number),variants in sorted(candidates.items()):
        def read_source(f):
            options=[]
            for directory in [texts,texts.parent/'texts']:
                path=directory/(f['sha256']+'.txt')
                if path.exists():options.append(path.read_text(encoding='utf8'))
            def score(t):
                gs,_=parse_paper(t,{})
                qs=[q for g in gs for q in g['questions']]
                valid=sum(bool(q['choices']) and all(0<len(v)<350 for v in q['choices'].values()) for q in qs)
                return (valid,len(qs),sum(len(g['paragraphs']) for g in gs))
            return max(options,key=score) if options else ''
        variant_texts=[(f,read_source(f)) for f in variants]
        def variant_score(pair):
            gs,_=parse_paper(pair[1],{});qs=[q for g in gs for q in g['questions']]
            return (sum(bool(q['choices']) and all(0<len(v)<350 for v in q['choices'].values()) for q in qs),len(qs),len(pair[1]))
        source,text=max(variant_texts,key=variant_score)
        answerfiles=[f for f in inv['files'] if f['exam']==exam and f['category']=='answer' and (set_number(f['path'])==number or f['extension']=='.md')]
        maps=[answer_candidates(text)]
        for f in answerfiles:
            p=texts/(f['sha256']+'.txt')
            if p.exists():maps.append(answer_candidates(p.read_text(encoding='utf8')))
        answers={}
        for n in range(1,56):
            values={m[n] for m in maps if n in m}
            if len(values)==1:answers[n]=values.pop()
        groups,issues=parse_paper(text,answers)
        if not text.strip():issues.append('ocr-required')
        if number=='2-3':issues.append('combined-variants-require-separation')
        sources=[{'id':'source-'+f['sha256'][:20],'path':f['path'],'bytes':f['bytes'],'sha256':f['sha256'],'contentType':'application/pdf' if f['extension']=='.pdf' else 'text/markdown'} for f in [source]+answerfiles]
        paper={'id':'cet4-'+exam.replace('.','-')+'-'+number,'exam':exam,'title':exam+' · '+('第'+number+'套' if number!='2-3' else '第2/3套合卷'),'version':1,'status':'needs-review','objectiveCount':sum(len(g['questions']) for g in groups),'subjectiveCount':sum(bool(g.get('task')) for g in groups),'sources':sources,'groups':groups,'reviewNotes':['自动提取候选；需要核对题干、选项顺序、参考答案与听力音频。'],'quality':{'issues':issues,'sourceVariants':[f['path'] for f in variants],'textExtracted':bool(text.strip()),'answersConfirmed':sum(bool(q.get('answer')) for g in groups for q in g['questions'])}}
        (out/(paper['id']+'.json')).write_text(json.dumps(paper,ensure_ascii=False,indent=2),encoding='utf8');papers.append(paper)
        print(paper['id'],paper['objectiveCount'],paper['quality']['answersConfirmed'],len(issues),flush=True)
    index={'schemaVersion':2,'files':inv['fileCount'],'sessions':len(inv['sessions']),'papers':[{'id':p['id'],'exam':p['exam'],'title':p['title'],'status':p['status'],'objectiveCount':p['objectiveCount'],'subjectiveCount':p['subjectiveCount'],'groups':len(p['groups']),'quality':p['quality']} for p in papers]}
    (out/'catalog.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf8')
    print('TOTAL',len(papers),'candidates,',sum(p['objectiveCount'] for p in papers),'questions; none auto-published')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--inventory',type=Path,required=True);p.add_argument('--texts',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();build(a.root,a.inventory,a.texts,a.out)
