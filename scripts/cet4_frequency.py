"""Reproducible, explicitly provisional vocabulary from deduplicated reading materials.

The dictionary supplies definitions, NOT the ranking. No answer explanations,
directions or duplicated file variants are deliberately counted as a corpus.
"""
from pathlib import Path
from collections import Counter,defaultdict
import argparse,json,re,hashlib

STOP=set('the a an and or but if of to in on at for with by from as is are was were be been being am have has had do does did this that these those it its they their them he his him she her we our us you your i me my not no so than then there here when where who whom whose which what how why can could will would shall should may might must also very more most much many some any each other such both all only into out up down over under about through before after during between among per once'.split())
def build(batch,dictionary,output,cards):
    entries={w['word'].lower():w for w in json.loads(dictionary.read_text(encoding='utf8'))['words'] if any(t.strip() and not t.startswith('[') for t in w.get('translations',[]))}
    def lemma(w):
        if w in entries:return w
        candidates=[]
        if w.endswith('ies'):candidates.append(w[:-3]+'y')
        if w.endswith('s'):candidates.extend([w[:-1],w[:-2]])
        for suffix in ['ing','ed']:
            if w.endswith(suffix):
                base=w[:-len(suffix)];candidates.extend([base,base+'e'])
                if len(base)>2 and base[-1]==base[-2]:candidates.append(base[:-1])
        found={x for x in candidates if x in entries}
        return next(iter(found)) if len(found)==1 else None
    materials={};papers=set();exams=set()
    for path in sorted(batch.glob('cet4-*.json')):
        paper=json.loads(path.read_text(encoding='utf8'))
        for group in paper['groups']:
            if group['kind'] not in ['reading','matching','cloze'] or not group['paragraphs']:continue
            text=' '.join(p['text'] for p in group['paragraphs'])
            text=re.sub(r'(?i)^.*?(?:more than once|centre\.|center\.)','',text) if 'Directions' in text[:400] else text
            fingerprint=hashlib.sha256(re.sub('[^a-z]','',text.lower()).encode()).hexdigest()
            if len(re.findall('[A-Za-z]+',text))<60:continue
            source={'paperId':paper['id'],'groupId':group['id'],'exam':paper['exam']}
            if fingerprint in materials:materials[fingerprint]['sources'].append(source)
            else:materials[fingerprint]={'text':text,'sources':[source]}
            papers.add(paper['id']);exams.add(paper['exam'])
    frequency=Counter();appearances=defaultdict(list);exam_sets=defaultdict(set)
    for fingerprint,m in materials.items():
        counts=Counter()
        for token in re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?",m['text']):
            word=lemma(token.lower())
            if word and word not in STOP and len(word)>2:counts[word]+=1
        frequency.update(counts)
        for word in counts:appearances[word].append(fingerprint);exam_sets[word].update(s['exam'] for s in m['sources'])
    ranked=sorted(frequency,key=lambda w:(-len(exam_sets[w]),-len(appearances[w]),-frequency[w],w))[:1000]
    if len(ranked)<1000:raise ValueError('Insufficient dictionary-matched words: '+str(len(ranked)))
    words=[];learning=[]
    for rank,word in enumerate(ranked,1):
        item=entries[word];sources=[s for fingerprint in appearances[word] for s in materials[fingerprint]['sources']]
        meta={'word':word,'rank':rank,'frequency':frequency[word],'materials':len(appearances[word]),'exams':len(exam_sets[word]),'sources':sources}
        words.append(meta)
        learning.append({'word':word,'phonetic':item.get('phonetic',''),'meaning':'；'.join(t for t in item.get('translations',[]) if not t.startswith('[')),'cetFrequency':frequency[word],'materialCount':len(appearances[word]),'examCount':len(exam_sets[word]),'note':f'已提取阅读语料候选第{rank}位；{len(exam_sets[word])}个场次、{len(appearances[word])}篇去重材料中出现{frequency[word]}次。统计待随全文校对更新，不代表完整十年考频。'})
    result={'schemaVersion':1,'status':'provisional-partial-parsed-corpus','method':'CET4-dictionary intersection; conservative unambiguous suffix normalization; deduplicated reading passages; sort by exam coverage, material coverage, token frequency; exclude function words','dictionary':'grhliu/wordtyper-vocabularies/vocabularies/cet4.json; MIT','parsedPapers':len(papers),'parsedExams':len(exams),'uniqueMaterials':len(materials),'wordCount':len(words),'words':words}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    cards.write_text('// MIT dictionary definitions; candidate frequencies from owner-supplied parsed reading materials.\nexport const paperFrequencyWords='+json.dumps(learning,ensure_ascii=False,indent=2)+';\nexport const paperFrequencyCoverage='+json.dumps({k:result[k] for k in ['status','parsedPapers','parsedExams','uniqueMaterials','wordCount']})+';\n',encoding='utf8')
    print(json.dumps({k:result[k] for k in ['status','parsedPapers','parsedExams','uniqueMaterials','wordCount']}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--batch',type=Path,required=True);p.add_argument('--dictionary',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--cards',type=Path,required=True);a=p.parse_args();build(a.batch,a.dictionary,a.output,a.cards)
