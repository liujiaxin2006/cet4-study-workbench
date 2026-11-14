"""Reconstruct owner-supplied papers and strict answer keys, with per-source provenance.

Never infer an answer from the A option printed in the question paper. A structural
check is not manual approval: this writes a private review bundle, not production.
"""
from pathlib import Path
import json,re,zipfile,xml.etree.ElementTree as ET,collections,argparse,copy
import pymupdf
from cet4_pipeline import set_number,parse_paper,clean,make_group

def normalized(s):
    s=re.sub(r'(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])','',s)
    return s.replace('\u00ad','').replace('\x00','')

def native_text_ok(raw):
    return len(re.findall('[A-Za-z\u4e00-\u9fff]',raw))>=40 and '\ufffd' not in raw and len(re.findall('[\u0080-\u024f\u0370-\u052f\u0600-\u0fff]',raw))<30

def answer_layout(words,width):
    import statistics
    if not words:return ''
    typical=statistics.median(w['height'] for w in words if w['height']>3);rows=[]
    # Printed columns are often offset from the physical page centre. Locate
    # their actual whitespace gutter before deciding which rows can be split.
    mid=min(range(int(width*.45),int(width*.55)),key=lambda x:sum(w['height'] for w in words if w['x']<x<w['x']+w['width']))
    gutter=0
    for w in sorted(words,key=lambda w:w['y']+w['height']/2):
        cy=w['y']+w['height']/2
        if rows and abs(rows[-1][0]-cy)<typical*.5:rows[-1][1].append(w)
        else:rows.append((cy,[w]))
    def line(ws):return ' '.join(w['text'] for w in sorted(ws,key=lambda w:w['x']))
    def clear(row):return not any(w['x']<mid+gutter and w['x']+w['width']>mid-gutter for w in row[1])
    result=[];i=0
    while i<len(rows):
        end=i
        while end<len(rows) and clear(rows[end]) and (end==i or rows[end][0]-rows[end-1][0]<typical*3):end+=1
        region=rows[i:end]
        left=sum(any(w['x']<mid for w in ws) for _,ws in region);right=sum(any(w['x']>=mid for w in ws) for _,ws in region)
        if len(region)>=3 and left>=2 and right>=2:
            for side in [True,False]:result.extend(line([w for w in ws if (w['x']<mid)==side]) for _,ws in region)
            i=end
        else:
            result.append(line(rows[i][1]));i+=1
    return normalized('\n'.join(result))

def pdf_pages(root,f,cache):
    pages=[]
    indexPath=cache.parent.parent/'translation-page-index.json'
    translationPages={(x['source'],x['page']) for x in json.loads(indexPath.read_text(encoding='utf8'))} if indexPath.exists() else set()
    for n,page in enumerate(pymupdf.open(root/f['path'])):
        raw=page.get_text()
        if f['category']=='answer':raw=answer_layout([{'text':w[4],'x':w[0],'y':w[1],'width':w[2]-w[0],'height':w[3]-w[1]} for w in page.get_text('words')],page.rect.width)
        translationPage=f['category']=='paper' and ((f['sha256'],n+1) in translationPages or re.search(r'(?im)^\s*(?:Part\s*\S+\s*)?Translation\b.{0,35}$',raw))
        if not native_text_ok(raw) or (translationPage and len(re.findall('[\u4e00-\u9fff]',raw))<100):
            path=cache/(f['sha256']+'-'+str(n+1)+'.json')
            if path.exists():
                data=json.loads(path.read_text(encoding='utf-8-sig'))
                raw=answer_layout([w for l in data['lines'] for w in l.get('words',[])],page.rect.width*2) if f['category']=='answer' else '\n'.join(l['text'] for l in data['lines'])
        pages.append(normalized(raw))
    return pages

def text(root,f,cache):
    if f['extension']=='.pdf':return pdf_pages(root,f,cache)
    if f['extension']=='.docx':
        with zipfile.ZipFile(root/f['path']) as z:
            xml=ET.fromstring(z.read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            return ['\n'.join(''.join(p.itertext()) if False else ''.join(t.text or '' for t in p.findall('.//w:t',ns)) for p in xml.findall('.//w:p',ns))]
    if f['extension']=='.md':return [(root/f['path']).read_text(encoding='utf8')]
    return []

def answer_keys(pages):
    result=collections.defaultdict(list)
    for pageNo,page in enumerate(pages,1):
        if pageNo<len(pages):
            continuation=re.split(r'(?m)^\s*\d{1,2}\s*[.．、，,·@]\s*',pages[pageNo])[0]
            page+='\n'+continuation[:10000]
        # Answer-only PDFs also include compact number/letter tables.
        for line in page.splitlines():
            pairs=re.findall(r'(\d{1,2})\s*[.．、:：]\s*([A-P])(?=\s|$|\d)',line)
            if len(pairs)>=3 and not re.search(r'[a-z\u4e00-\u9fff]',line):
                for number,letter in pairs:
                    if 1<=int(number)<=55:result[int(number)].append({'answer':letter,'page':pageNo,'method':'numbered-answer-row'})
            ranged=re.fullmatch(r'\s*(\d{1,2})\s*[-—–~～]\s*(\d{1,2})\s*[:：.]?\s*([A-O ]+)\s*',line)
            if ranged:
                lo,hi=int(ranged[1]),int(ranged[2]);letters=ranged[3].replace(' ','')
                if 1<=lo<=hi<=55 and len(letters)==hi-lo+1:
                    for i,v in enumerate(letters):result[lo+i].append({'answer':v,'page':pageNo,'method':'ranged-answer-row'})
        tokens=page.split();cursor=0
        while cursor<len(tokens):
            end=cursor
            while end<len(tokens) and re.fullmatch(r'\d{1,2}',tokens[end]):end+=1
            numbers=[int(n) for n in tokens[cursor:end]]
            letters=tokens[end:end+len(numbers)]
            if len(numbers)>=3 and numbers==list(range(numbers[0],numbers[0]+len(numbers))) and 1<=numbers[0]<=numbers[-1]<=55 and len(letters)==len(numbers) and all(re.fullmatch('[A-P]',v) for v in letters):
                for n,v in zip(numbers,letters):result[n].append({'answer':v,'page':pageNo,'method':'answer-table'})
                cursor=end+len(numbers)
            else:cursor=max(cursor+1,end)
        # A key is accepted only with an explicit answer label, or at the beginning
        # of a numbered explanation. MC options in a paper are never scanned here.
        matches=list(re.finditer(r'(?m)^\s*(\d{1,2})(?:\s*[.．、，,·@]\s*|\s+(?=[A-Za-z10]))',page))
        for i,m in enumerate(matches):
            n=int(m.group(1));block=page[m.end():matches[i+1].start() if i+1<len(matches) else len(page)]
            if not 1<=n<=55:continue
            block=re.sub(r'^([a-o])([)）])',lambda m:m.group(1).upper()+m.group(2),block)
            prefix=re.match(r'[〖【\[](?:参考答案|正确答案|答案)[〗】\]]\s*[:：]?\s*([A-P])(?=[)）\]】.\s]|$)',block) or re.match(r'([A-P])[)）\]】.]',block)
            if not prefix:prefix=re.match(r'[〖【（](?:考点|定位)[〗】）][^\n]*\n\s*([A-P])[)）]',block)
            if not prefix and 26<=n<=35:prefix=re.search(r'(?m)^\s*([A-O])[)）]\s*',block)
            if not prefix and re.search(r'详解|解析',block[:180]):
                prefix=re.search(r'(?m)^\s*([A-P])[)）](?=[^\n]{0,80}(?:详解|解析))',block)
            candidates=re.findall(r'(?:正确答案|答案)(?:应|应该)?(?:为|是|选|选择)\s*([A-P])(?=[)）\s。．.,，]|$)',block,re.I)
            candidates+=re.findall(r'(?:故|因此|所以|由此|因而)(?:本题)?(?:应|应该)?选(?:择)?\s*([A-P])(?=[)）\s。．.,，正]|$)',block,re.I)
            candidates+=re.findall(r'(?:因此|故|所以)[^。\n]{0,12}?选项\s*([A-P])\s*(?:是|为)?正[\s《〈|丨]*确',block,re.I)
            for verdict in re.finditer(r'(?:选项\s*([A-P])|([A-P])\s*项)\s*(?:是|为)?正[\s《〈|丨]*确',block,re.I):
                before=block[max(0,verdict.start()-8):verdict.start()]
                if not re.search(r'不|非|不能|假如|如果',before):candidates.append(verdict.group(1) or verdict.group(2))
            candidates=[v.upper() for v in candidates]
            if prefix:candidates.append(prefix.group(1))
            if candidates and len(set(candidates))==1:result[n].append({'answer':candidates[0],'page':pageNo,'method':'explicit-answer-explanation'})
    return {n:vs[0] for n,vs in result.items() if len({v['answer'] for v in vs})==1 and vs[0]['answer'] in ('ABCD' if n<=25 or n>=46 else 'ABCDEFGHIJKLMNO' if n<=35 else 'ABCDEFGHIJKLMNOP')}

def english_paper_text(root,f,cache):
    import statistics
    pages=[]
    for n,page in enumerate(pymupdf.open(root/f['path'])):
        path=cache/(f['sha256']+'-'+str(n+1)+'-en.json')
        if not path.exists():pages.append(page.get_text());continue
        data=json.loads(path.read_text(encoding='utf-8-sig'));words=[w for l in data.get('lines',[]) for w in l.get('words',[])]
        widths=[w['width']/len(w['text']) for w in words if len(w['text'])>3 and re.fullmatch('[A-Za-z]+',w['text'])]
        if not widths:pages.append(page.get_text());continue
        unit=statistics.median(widths);rows=[]
        for w in sorted(words,key=lambda w:w['y']+w['height']/2):
            centre=w['y']+w['height']/2
            if rows and abs(rows[-1][0]-centre)<max(8,w['height']*.45):rows[-1][1].append(w)
            else:rows.append((centre,[w]))
        lines=[]
        for _,row in rows:
            line=''
            for w in sorted(row,key=lambda w:w['x']):
                start=round(w['x']/unit);line+=' '*max(1,start-len(line))+w['text']
            lines.append(line)
        pages.append('\n'.join(lines))
    return '\n\f\n'.join(pages)

def translation_ocr_text(f,cache):
    for path in sorted(cache.glob(f['sha256']+'-*-en.json'),key=lambda p:int(p.stem.split('-')[-2])):
        english=json.loads(path.read_text(encoding='utf-8-sig'));header=next((l for l in english['lines'] if len(re.sub('[^a-z]','',l['text'].lower()))<60 and re.search('translat[il1]on',re.sub('[^a-z0-9]','',l['text'].lower())) and re.match(r'(?i)^\s*(Part|Translation|Translatlon)',l['text'])),None)
        if not header:continue
        chinese=path.with_name(path.name.replace('-en.json','.json'))
        if not chinese.exists():return ''
        bottom=max(w['y']+w['height'] for w in header.get('words',[]))
        data=json.loads(chinese.read_text(encoding='utf-8-sig'));lines=[l['text'] for l in data['lines'] if l.get('words') and min(w['y'] for w in l['words'])>bottom+2]
        return 'Part IV\nTranslation\n'+normalized('\n'.join(lines))
    return ''

def boxed_answer_keys(f,cache,root=None):
    found=collections.defaultdict(list)
    def collect(rows,width,pageNo,method):
        allWords=[w for row in rows for w in row];letterWords=[w for w in allWords if re.fullmatch('[A-Pa-p][)）]?',w['text'])];half=width/2
        for row in rows:
            for side in [True,False]:
                segment=sorted([w for w in row if (w['x']<half)==side],key=lambda w:w['x'])
                if not segment:continue
                first=segment[0];token=first['text'].replace('2&','28')
                m=re.match(r'^(\d{1,2})(?:[.．、，,·@]|$)',token)
                if not m:continue
                n=int(m.group(1))
                if not 1<=n<=55:continue
                direct=re.match(r'^\d{1,2}[.．]([A-P])[)）]',token)
                if direct and direct.group(1) in ('ABCD' if n<=25 or n>=46 else 'ABCDEFGHIJKLMNO' if n<=35 else 'ABCDEFGHIJKLMNOP'):found[n].append({'answer':direct.group(1),'page':pageNo,'method':method,'tier':0 if 'native' in method else 1});continue
                candidates=[]
                for w in letterWords:
                    if w['text'][0].upper() not in ('ABCD' if n<=25 or n>=46 else 'ABCDEFGHIJKLMNO' if n<=35 else 'ABCDEFGHIJKLMNOP'):continue
                    dy=w['y']-first['y'];dx=w['x']-first['x'];height=max(first['height'],12)
                    if (-height*.35<=dy<=height*.4 and 0<=dx<=height*4.5) or (height*.4<dy<=height*3 and abs(dx)<height*1.5):candidates.append(w)
                if candidates:
                    w=min(candidates,key=lambda w:abs(w['y']-first['y'])+abs(w['x']-first['x']))
                    found[n].append({'answer':w['text'][0].upper(),'page':pageNo,'method':method,'tier':(0 if 'native' in method else 1 if 'english' in method else 2)+(0 if w['text'].endswith((')', '）')) else 3)})
    for path in cache.glob(f['sha256']+'-*.json'):
        parts=path.stem[len(f['sha256'])+1:].split('-')
        if not parts[0].isdigit():continue
        data=json.loads(path.read_text(encoding='utf-8-sig'));rows=[l.get('words',[]) for l in data.get('lines',[])];image=path.with_name(path.name.replace('-en.json','.png').replace('.json','.png'))
        if not image.exists():continue
        width=int.from_bytes(image.read_bytes()[16:20],'big');collect(rows,width,int(parts[0]),'positioned-english-answer-prefix' if '-en' in path.stem else 'positioned-chinese-answer-prefix')
    if root is not None and f['extension']=='.pdf':
        for n,page in enumerate(pymupdf.open(root/f['path'])):
            raw=page.get_text()
            if not native_text_ok(raw):continue
            rows=collections.defaultdict(list)
            for w in page.get_text('words'):rows[w[5:7]].append({'text':w[4],'x':w[0],'y':w[1],'width':w[2]-w[0],'height':w[3]-w[1]})
            collect(list(rows.values()),page.rect.width,n+1,'positioned-native-answer-prefix')
    selected={}
    for n,vs in found.items():
        tier=min(v.get('tier',5) for v in vs);best=[v for v in vs if v.get('tier',5)==tier]
        if len({v['answer'] for v in best})==1:selected[n]=best[0]
    return selected

def english_answer_pages(f,cache):
    pages=[]
    for path in sorted(cache.glob(f['sha256']+'-*-en.json'),key=lambda p:int(p.stem.split('-')[-2])):
        data=json.loads(path.read_text(encoding='utf-8-sig'));image=path.with_name(path.name.replace('-en.json','.png'))
        with image.open('rb') as stream:width=int.from_bytes(stream.read(24)[16:20],'big')
        raw=answer_layout([w for l in data['lines'] for w in l.get('words',[])],width)
        pages.append(raw)
    return pages

def markdown_keys(md,number):
    answer={};section=''
    for line in md.splitlines():
        if line.startswith('## '):section=line
        if re.match(r'\| 第 '+re.escape(number)+r' 套 \|',line):
            cells=[c.strip() for c in line.split('|')[2:-1]]
            letters=[v for c in cells for v in c.split()]
            start=26 if '阅读' in section else 1 if '听力' in section else 0
            if start and len(letters)==(30 if start==26 else 25) and all(re.fullmatch('[A-P]',l) for l in letters):
                answer.update({start+i:{'answer':v,'page':1,'method':'set-specific-reference-table'} for i,v in enumerate(letters)})
    return answer

def confirmed_answers(records):
    result={}
    for n,values in records.items():
        priority=min(v.get('confidence',3) for v in values);best=[v for v in values if v.get('confidence',3)==priority]
        if len({v['answer'] for v in best})==1:result[n]=best[0]['answer']
    return result

def answer_appendix(raw):
    keys=re.search(r'(?im)^\s*KEYS\s*$',raw)
    if keys:return raw[keys.end():],raw[:keys.end()].count('\f')+1
    last_question=re.search(r'(?m)^\s*55\s*[.．、]',raw)
    if not last_question:return None
    for m in re.finditer(r'(?im)^\s*[〖【\[]?(?:参考答案|答案与详解|答案解析|答案详解|Suggested\s*Version)',raw):
        if m.start()>last_question.end():return raw[m.end():],raw[:m.end()].count('\f')+1
    return None

def answer_details(pages):
    raw='\n'.join(pages);matches=list(re.finditer(r'(?m)^\s*(\d{1,2})(?:\s*[.．、，,·@]\s*|\s+(?=[A-Za-z10]))',raw));result={}
    for i,m in enumerate(matches):
        n=int(m.group(1))
        if not 26<=n<=55:continue
        block=raw[m.end():matches[i+1].start() if i+1<len(matches) else len(raw)]
        block=re.split(r'(?im)^\s*(?:Part\s+[IVXⅠⅡⅢⅣ]+|Passage\s+(?:One|Two)|[〖【]?参考译文[〗】]?)',block)[0]
        block=re.sub(r'(?m)^\s*(?:20\d\d[.．/年].*|四级.*20\d\d.*|\d{1,3})\s*$','',block).strip()
        if 80<len(re.findall('[\u4e00-\u9fff]',block)) and len(block)<=10000 and '\ufffd' not in block:
            result[n]={'kind':'原卷参考解析','evidence':'','explanation':block,'action':'回到原文核对定位信息，并检查其他选项的错误原因。'}
    return result

def normalize_group(g):
    def body(value):
        value=re.sub(r'(?im)^You may not use any of the words in the bank more than once\.\s*','',value)
        value=re.sub(r'(?i)Questions?\s+\d+\s+to\s+\d+\s+are based on the following passage\.\s*','',value)
        value=re.sub(r'\b[A-E]\s+\S+\s+[F-J][)）]\s+\S+\s+[K-O][)）]\s+\S+\s*','',value)
        value=re.sub(r'^\S+\s+[F-J][)）]\s+\S+\s+[K-O][)）]\s+\S+\s*','',value)
        value=re.sub(r'\s+-\s*\d+\s*-\s*',' ',value)
        return value.strip()
    for p in g['paragraphs']:p['text']=body(p['text'])
    if g['kind']=='matching':
        g['paragraphs']=[p for p in g['paragraphs'] if p['text']]
        for q in g['questions']:q['choices']={p['label']:'段落'+p['label'] for p in g['paragraphs']}
    if g['kind']=='cloze':
        for p in g['paragraphs']:
            value=re.sub(r'[_＿]+',' ',p['text'])
            for n in range(26,36):
                if '['+str(n)+']' not in value:value=re.sub(r'(?<![\d\[])'+str(n)+r'(?![\d\]])',' ['+str(n)+'] ',value)
            p['text']=re.sub(r' +',' ',value).strip()
    if g['kind']=='writing':
        value=re.sub(r'_+','',g.get('task',''))
        value=re.sub(r'\s*Part\s+[I1lⅡ]+\b.*$','',value,flags=re.I)
        value=re.split(r'(?i)Suggested\s*Version|参考范文|范文点评|Sample\s*Essay',value)[0]
        value=re.sub(r'^.*?(?=For this part|Suppose|In this task)','',value,flags=re.S)
        value=re.sub(r'^\s*\(30 minutes\)\s*','',value)
        g['task']=value.strip()
    return g

def matching_paragraph_ok(p):
    text=p['text'];plain=re.sub(r'[（(][^()（）]*[)）]','',text)
    return len(re.findall('[A-Za-z]+',plain))>=8 and bool(re.search('[.!?]',plain)) and len(re.findall(r'(?<![A-Za-z])[A-P][)）.]',plain))<3 and not re.search('[\u4e00-\u9fff]{4,}',plain)

def question_text_ok(kind,q):
    if not q.get('prompt') or len(q['prompt'])>500:return False
    if kind in ['reading','matching'] and len(re.findall('[A-Za-z]+',q['prompt']))<3:return False
    if kind in ['reading','news','conversation','listening-passage'] and set(q['choices'])!=set('ABCD'):return False
    if kind=='cloze' and (set(q['choices'])!=set('ABCDEFGHIJKLMNO') or any(not re.fullmatch(r"[A-Za-z]+(?:['’-][A-Za-z]+)*",v.strip()) for v in q['choices'].values())):return False
    values=[q['prompt']] if kind in ['reading','matching'] else []
    if kind!='matching':values+=list(q['choices'].values())
    return all(0<len(v)<=max(500 if v==q['prompt'] else 350,1) and not re.search('[\u4e00-\u9fff]{4,}',re.sub(r'[（(][^()（）]*[)）]','',v)) for v in values)

def core_issues(g):
    normalize_group(g);kind=g['kind'];qs=g['questions'];expected={'cloze':10,'matching':10,'reading':5,'news':7,'conversation':8,'listening-passage':10}.get(kind,0);errors=[]
    if len(qs)!=expected:errors.append('question-count')
    if kind in ['writing','translation']:
        task=g.get('task','');task=re.sub(r'\s*Part\s+[IVX12]+\s*$','',task).strip();g['task']=task
        if not 60<len(task)<2000:errors.append('task-boundary')
        if kind=='translation' and (len(re.findall('[\u4e00-\u9fff]',task))<100 or not re.match('[\u4e00-\u9fff0-9]',task) or not task.endswith(('。','！','？','.','!','?'))):errors.append('translation-source')
        if kind=='writing' and (not re.match(r'(?i)(For this part|Suppose|In this task)',task) or not re.search(r'120\s*words',task) or not re.search(r'180\s*words',task) or len(re.findall('[\u4e00-\u9fff]',task))>3 or not re.search(r'(?i)(?:suppose|for this part|you are|write)',task)):errors.append('writing-source')
    if kind in ['reading','cloze','matching']:
        body=' '.join(p['text'] for p in g['paragraphs'])
        if len(body)<150 or '\ufffd' in body or re.search('[\u4e00-\u9fff]{4,}',re.sub(r'[（(][^()（）]*[)）]','',body)):errors.append('passage-source')
    for q in qs:
        if not question_text_ok(kind,q):errors.append('question-source')
        if not q.get('answer') or q['answer'] not in q['choices']:errors.append('answer')
        if not q['prompt'] or len(q['prompt'])>500:errors.append('prompt')
        if any(not 0<len(v)<=350 for v in q['choices'].values()):errors.append('option')
        if kind not in ['matching','cloze'] and set(q['choices'])!=set('ABCD'):errors.append('option-count')
        if kind=='cloze' and set(q['choices'])!=set('ABCDEFGHIJKLMNO'):errors.append('word-bank')
    if kind=='matching' and any(not matching_paragraph_ok(p) for p in g['paragraphs']):errors.append('paragraph-source')
    if kind=='matching' and len({p['label'] for p in g['paragraphs']})!=len(g['paragraphs']):errors.append('duplicate-paragraph')
    if kind=='cloze' and any(sum(p['text'].count('['+str(n)+']') for p in g['paragraphs'])!=1 for n in range(26,36)):errors.append('blank-boundary')
    if kind=='cloze' and len({tuple(sorted(q['choices'].items())) for q in qs})>1:errors.append('different-word-banks')
    if kind=='cloze' and len({q.get('answer') for q in qs})!=10:errors.append('duplicate-cloze-answer')
    return sorted(set(errors))

def build(root,inventory,cache,out,corrections=None):
    manual=json.loads(corrections.read_text(encoding='utf8')) if corrections else {}
    inv=json.loads(inventory.read_text(encoding='utf8'));out.mkdir(parents=True,exist_ok=True);files=inv['files'];candidates=collections.defaultdict(list);texts={}
    def read(f):
        if f['sha256'] not in texts:texts[f['sha256']]=text(root,f,cache)
        return texts[f['sha256']]
    for f in files:
        if f['category']=='paper' and f['extension'] in ['.pdf','.docx'] and set_number(f['path']):candidates[(f['exam'],set_number(f['path']))].append(f)
    dictionary=cache.parent.parent/'cet4-dictionary.json'
    lexicon={w['word'].lower() for w in json.loads(dictionary.read_text(encoding='utf8'))['words']} if dictionary.exists() else set()
    from cet4_frequency import STOP
    lexicon.update(STOP)
    def fluency(g):
        raw=' '.join([g.get('task','')]+[p['text'] for p in g['paragraphs']]+[q['prompt']+' '+' '.join(q['choices'].values()) for q in g['questions']]);words=re.findall('[A-Za-z]{2,}',raw.lower())
        return sum(w in lexicon or any(w.endswith(suf) and w[:-len(suf)] in lexicon for suf in ['s','es','ed','ing']) for w in words)/max(1,len(words))
    audit=[]
    for (exam,number),variants in sorted(candidates.items()):
        answers=collections.defaultdict(list);details={};answerfiles=[f for f in files if f['exam']==exam and f['category']=='answer' and (set_number(f['path'])==number or f['extension']=='.md')]
        for f in answerfiles:
            keys=markdown_keys('\n'.join(read(f)),number) if f['extension']=='.md' else answer_keys(read(f));english=answer_keys(english_answer_pages(f,cache)) if f['extension']=='.pdf' else {}
            positioned=boxed_answer_keys(f,cache,root)
            # Position alone cannot distinguish a printed A option from an answer.
            # Use it only when the numbered block starts as an explanation, not a question.
            template='\n'.join(read(f));headings=list(re.finditer(r'(?m)^\s*(\d{1,2})\s*[.．、，,·@]\s*',template));safe=set()
            for i,m in enumerate(headings):
                block=template[m.end():headings[i+1].start() if i+1<len(headings) else len(template)]
                if re.match(r'\s*(?:[〖【]?(?:答案|考点|定位)|[A-P0][)）]\s*[〖【])',block):safe.add(int(m.group(1)))
            for n,k in english.items():
                if n in safe:keys.setdefault(n,k)
            keys.update({n:k for n,k in positioned.items() if n in safe})
            nativePages={}
            if f['extension']=='.pdf':
                for pageNo,page in enumerate(pymupdf.open(root/f['path']),1):
                    raw=page.get_text();nativePages[pageNo]=native_text_ok(raw)
            for n,k in keys.items():
                table=k['method'] in ['answer-table','numbered-answer-row','ranged-answer-row','set-specific-reference-table']
                native=f['extension']=='.md' or nativePages.get(k['page'],False)
                answers[n].append({**k,'confidence':0 if table and native else 1 if native else 3,'sha256':f['sha256'],'path':f['path']})
            for n,detail in answer_details(read(f)).items():details.setdefault(n,[]).append((keys.get(n,{}).get('answer'),detail))
        for f in variants:
            if f['extension']=='.pdf':
                doc=pymupdf.open(root/f['path']);nativePages=[p.get_text() for p in doc];flags={i+1:native_text_ok(t) for i,t in enumerate(nativePages)};raw='\n\f\n'.join(nativePages)
            else:raw='\n\f\n'.join(read(f));flags={1:True}
            appendix=answer_appendix(raw);native=True
            if not appendix and f['extension']=='.pdf':appendix=answer_appendix(english_paper_text(root,f,cache));native=False
            if not appendix:continue
            raw_appendix,offset=appendix
            for n,k in answer_keys(raw_appendix.split('\f')).items():
                pageNo=offset+k['page']-1;table=k['method'] in ['answer-table','numbered-answer-row','ranged-answer-row']
                confidence=0 if native and flags.get(pageNo,False) and table else 2 if native and flags.get(pageNo,False) else 4
                answers[n].append({**k,'page':pageNo,'method':'paper-appendix-'+k['method'],'confidence':confidence,'sha256':f['sha256'],'path':f['path']})
        agreed=confirmed_answers(answers)
        options=[]
        for f in variants:
            alternatives=['\n\f\n'.join(read(f))]
            if f['extension']=='.pdf':
                alternatives.append(english_paper_text(root,f,cache));translation=translation_ocr_text(f,cache)
                if translation:alternatives.append(translation)
            for directory in [cache.parent,cache.parent.parent/'texts']:
                existing=directory/(f['sha256']+'.txt')
                if existing.exists():alternatives.append(normalized(existing.read_text(encoding='utf8')))
            for raw in alternatives:
                groups,issues=parse_paper(raw,agreed)
                score=sum(len(g['questions']) or 1 for g in groups if not core_issues(g))
                options.append((score,sum(len(g['questions']) for g in groups),f,groups,issues))
        _,_,source,_,issues=max(options,key=lambda v:v[:2])
        # Merge independent readings of the SAME PDF, preserving its option order.
        # This repairs one OCR reading's missing question with that file's other reading.
        for f in variants:
            byId=collections.defaultdict(list)
            for _,_,candidate,gs,_ in options:
                if candidate['sha256']==f['sha256']:
                    for g in gs:byId[g['id']].append(g)
            mergedGroups=[]
            for gid,gs in byId.items():
                base=copy.deepcopy(max(gs,key=lambda g:(not bool(core_issues(g)),fluency(g))))
                numbers=sorted({q['number'] for g in gs for q in g['questions']})
                base['questions']=[copy.deepcopy(max([q for g in gs for q in g['questions'] if q['number']==n],key=lambda q:(question_text_ok(base['kind'],q),fluency({'paragraphs':[],'questions':[q]})))) for n in numbers]
                if base['kind']=='cloze' and base['questions']:
                    banks=[q for g in gs for q in g['questions']]
                    best=max(banks,key=lambda q:(question_text_ok('cloze',q),fluency({'paragraphs':[],'questions':[q]})))['choices']
                    for q in base['questions']:q['choices']=copy.deepcopy(best)
                if base['kind']=='matching':
                    paragraphs=collections.defaultdict(list)
                    for g in gs:
                        for paragraph in g['paragraphs']:
                            if paragraph['text']:paragraphs[paragraph['label']].append(paragraph)
                    base['paragraphs']=[copy.deepcopy(max(ps,key=lambda p:(matching_paragraph_ok(p),fluency({'paragraphs':[p],'questions':[]})))) for label,ps in sorted(paragraphs.items())]
                    for q in base['questions']:q['choices']={p['label']:'段落'+p['label'] for p in base['paragraphs']}
                mergedGroups.append(base)
            options.append((sum(len(g['questions']) or 1 for g in mergedGroups if not core_issues(g)),sum(len(g['questions']) for g in mergedGroups),f,mergedGroups,[]))
        ids=list(dict.fromkeys(g['id'] for _,_,_,gs,_ in options for g in gs));groups=[];used=[]
        for gid in ids:
            variantsForGroup=[(g,f) for _,_,f,gs,_ in options for g in gs if g['id']==gid]
            g,f=max(variantsForGroup,key=lambda v:(not bool(core_issues(v[0])),not bool(set(core_issues(v[0]))-{'answer','duplicate-cloze-answer'}),len(v[0]['questions']),fluency(v[0]),len(v[0].get('task',''))+sum(len(p['text']) for p in v[0]['paragraphs'])))
            g['sourceId']='source-'+f['sha256'][:20];groups.append(g)
            if f not in used:used.append(f)
        pid='cet4-'+exam.replace('.','-')+'-'+number
        for gid,patch in manual.get(pid,{}).items():
            g=next((g for g in groups if g['id']==gid),None)
            if g is None:g=make_group(gid,patch.get('kind','writing'),patch.get('title','短文写作'),[],[],patch['task']);groups.insert(0,g)
            g.update({k:v for k,v in patch.items() if k in ['task','sourcePages','kind','title','reference','rubric']});g['sourceId']='source-'+variants[0]['sha256'][:20]
            g['task']=normalized(g['task'])
            if variants[0] not in used:used.append(variants[0])
        for g in groups:
            for q in g['questions']:
                if g['kind'] in ['reading','cloze','matching'] and q.get('answer'):
                    matching=[d for a,d in details.get(q['number'],[]) if a==q['answer']]
                    if matching:q['analysis']=max(matching,key=lambda d:len(d['explanation']))
            g['publication']='draft';g['issues']=core_issues(g)
            g['verification']={'source':source['sha256'],'answerEvidence':{str(q['number']):answers.get(q['number'],[]) for q in g['questions']},'method':'structural-review-candidate','textFluency':round(fluency(g),4)}
        paper={'id':'cet4-'+exam.replace('.','-')+'-'+number,'exam':exam,'title':exam+' · 第'+number+'套','version':3,'status':'needs-review','objectiveCount':sum(len(g['questions']) for g in groups),'subjectiveCount':sum(bool(g.get('task')) for g in groups),'sources':[{'id':'source-'+f['sha256'][:20],'path':f['path'],'bytes':f['bytes'],'sha256':f['sha256'],'contentType':'application/pdf' if f['extension']=='.pdf' else 'text/markdown' if f['extension']=='.md' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'} for f in used+answerfiles],'groups':groups,'reviewNotes':[],'quality':{'issues':issues,'sourceVariants':[f['path'] for f in variants]}}
        (out/(paper['id']+'.json')).write_text(json.dumps(paper,ensure_ascii=False,indent=2),encoding='utf8');audit.append({'id':paper['id'],'questions':paper['objectiveCount'],'coreValid':sum(len(g['questions']) for g in groups if not g['issues']),'groups':[{ 'id':g['id'],'kind':g['kind'],'questions':len(g['questions']),'issues':g['issues']} for g in groups]});print(paper['id'],audit[-1]['coreValid'],flush=True)
    (out/'audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8');print('TOTAL',len(audit),'papers',sum(p['coreValid'] for p in audit),'core-valid question candidates')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--inventory',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--corrections',type=Path);a=p.parse_args();build(a.root,a.inventory,a.cache,a.out,a.corrections)
