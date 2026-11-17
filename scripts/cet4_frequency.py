"""Rank dictionary-matched words in the current, published reading passages.

Only source paragraphs count; answers, options and commentary never count.
Ambiguous words (found, left, saw, means...) retain their own identities.
"""
from pathlib import Path
from collections import Counter, defaultdict
import argparse, json, re, hashlib

STOP = set('the a an and or but if of to in on at for with by from as is are was were be been being am have has had do does did this that these those it its they their them he his him she her we our us you your i me my not no so than then there here when where who whom whose which what how why can could will would shall should may might must also very more most much many some any each other such both all only into out up down over under about through before after during between among per once'.split())
AMBIGUOUS = set('found saw left right rose lay lie leaves means works lives close clothes news series species business analysis basis crisis physics economics mathematics politics goods savings earnings surroundings proceedings findings'.split())
IRREGULAR = {'children':'child','women':'woman','men':'man','teeth':'tooth','feet':'foot','mice':'mouse','geese':'goose','went':'go','gone':'go','took':'take','taken':'take','gave':'give','given':'give','wrote':'write','written':'write','knew':'know','known':'know','spoke':'speak','spoken':'speak','drove':'drive','driven':'drive','grew':'grow','grown':'grow','chose':'choose','chosen':'choose','began':'begin','begun':'begin','brought':'bring','bought':'buy','thought':'think','taught':'teach','caught':'catch','felt':'feel','kept':'keep','spent':'spend','built':'build','became':'become','ran':'run','ate':'eat','eaten':'eat','sought':'seek'}

def lemma(word, entries):
    word=word.lower().replace('’', "'")
    if word.endswith("'s"):word=word[:-2]
    if word in AMBIGUOUS:return word if word in entries else None
    if word in IRREGULAR and IRREGULAR[word] in entries:return IRREGULAR[word]
    candidates=[]
    if word.endswith('ies'):candidates.append(word[:-3]+'y')
    if word.endswith('ing'):
        stem=word[:-3];candidates += [stem,stem+'e']
        if len(stem)>2 and stem[-1]==stem[-2]:candidates.append(stem[:-1])
    if word.endswith('ied'):candidates.append(word[:-3]+'y')
    elif word.endswith('ed'):
        stem=word[:-2];candidates += [stem,stem+'e']
        if len(stem)>2 and stem[-1]==stem[-2]:candidates.append(stem[:-1])
    if word.endswith('es') and re.search(r'(?:s|x|z|ch|sh)es$',word):candidates.append(word[:-2])
    if word.endswith('s') and not word.endswith(('ss','us','is')):candidates.append(word[:-1])
    found={c for c in candidates if c in entries and c not in STOP and len(c)>2}
    # If the surface form is a separate dictionary entry, keep it unless its
    # definition explicitly identifies an inflection. Do not guess word senses.
    if word in entries:
        definitions=' '.join(entries[word].get('translations',[]))
        if not re.search('过去式|过去分词|现在分词|的复数',definitions):return word
    if len(found)==1:return next(iter(found))
    return word if word in entries else None

def build(batch,dictionary,output,cards,published=None):
    entries={w['word'].lower():w for w in json.loads(dictionary.read_text(encoding='utf8'))['words'] if any(t.strip() and not t.startswith('[') for t in w.get('translations',[]))}
    papers_data=json.loads(published.read_text(encoding='utf8')) if published else [json.loads(f.read_text(encoding='utf8')) for f in sorted(batch.glob('cet4-*.json'))]
    materials={};papers=set();exams=set();groups=0
    for paper in papers_data:
        if paper.get('status')!='published':continue
        for group in paper['groups']:
            if group['kind'] not in ['reading','matching','cloze'] or group.get('publication')!='ready' or group.get('issues') or not group['paragraphs']:continue
            text=' '.join(p['text'] for p in group['paragraphs'])
            fingerprint=hashlib.sha256(re.sub('[^a-z]','',text.lower()).encode()).hexdigest()
            if len(re.findall('[A-Za-z]+',text))<60:continue
            source={'paperId':paper['id'],'groupId':group['id'],'exam':paper['exam']}
            materials.setdefault(fingerprint,{'paragraphs':group['paragraphs'],'sources':[]})['sources'].append(source)
            papers.add(paper['id']);exams.add(paper['exam']);groups+=1
    frequency=Counter();appearances=defaultdict(list);exam_sets=defaultdict(set);forms=defaultdict(set)
    for fingerprint,m in materials.items():
        counts=Counter()
        for paragraph in m['paragraphs']:
            for token in re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?",paragraph['text']):
                word=lemma(token,entries)
                if word and word not in STOP and len(word)>2:counts[word]+=1;forms[word].add(token.lower().replace('’',"'"))
        frequency.update(counts)
        for word in counts:appearances[word].append(fingerprint);exam_sets[word].update(s['exam'] for s in m['sources'])
    ranked=sorted(frequency,key=lambda w:(-len(exam_sets[w]),-len(appearances[w]),-frequency[w],w))[:1000]
    if len(ranked)!=1000:raise ValueError('Insufficient dictionary-matched words')
    words=[];learning=[]
    for rank,word in enumerate(ranked,1):
        item=entries[word];sources=[s for f in appearances[word] for s in materials[f]['sources']]
        words.append({'word':word,'rank':rank,'frequency':frequency[word],'materials':len(appearances[word]),'exams':len(exam_sets[word]),'forms':sorted(forms[word]),'sources':sources})
        learning.append({'word':word,'phonetic':item.get('phonetic',''),'meaning':'；'.join(t for t in item.get('translations',[]) if not t.startswith('[')),'cetFrequency':frequency[word],'materialCount':len(appearances[word]),'examCount':len(exam_sets[word]),'forms':sorted(forms[word]),'readingRank':rank,'note':f'已发布阅读材料精选第{rank}位；覆盖{len(exam_sets[word])}个场次、{len(appearances[word])}篇去重材料，共出现{frequency[word]}次。按场次覆盖、材料覆盖、出现次数排序；不代表完整十年所有题型考频。'})
    result={'schemaVersion':2,'status':'published-reading-corpus','method':'published and ready reading/cloze/matching source paragraphs only; exact normalized text deduplication; dictionary-aware conservative inflections; ambiguous forms preserved; rank by exam coverage, material coverage, token frequency','dictionary':'grhliu/wordtyper-vocabularies/vocabularies/cet4.json; MIT','parsedPapers':len(papers),'parsedExams':len(exams),'readyReadingGroups':groups,'uniqueMaterials':len(materials),'wordCount':len(words),'corpusVersion':max(p.get('version',0) for p in papers_data),'words':words}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    coverage={k:result[k] for k in ['status','parsedPapers','parsedExams','readyReadingGroups','uniqueMaterials','wordCount','corpusVersion']}
    cards.write_text('// MIT dictionary; ranks from current published source paragraphs, never answer commentary.\nexport const paperFrequencyWords='+json.dumps(learning,ensure_ascii=False,indent=2)+';\nexport const paperFrequencyCoverage='+json.dumps(coverage)+';\n',encoding='utf8')
    print(json.dumps(coverage))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--batch',type=Path);p.add_argument('--published',type=Path);p.add_argument('--dictionary',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--cards',type=Path,required=True);a=p.parse_args()
    if not a.batch and not a.published:p.error('Supply --published or --batch')
    build(a.batch,a.dictionary,a.output,a.cards,a.published)
