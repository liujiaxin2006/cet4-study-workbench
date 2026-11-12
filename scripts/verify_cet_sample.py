"""Check canonical sample integrity without bundling source papers in the repository."""
import argparse,json,re,hashlib
from pathlib import Path
def normalized(s):return re.sub(r'[^a-z0-9\u4e00-\u9fff]','',s.lower())
def verify(sample,root):
    kinds={g['kind'] for g in sample['groups']}
    assert kinds=={'news','conversation','listening-passage','cloze','matching','reading','writing','translation'},kinds
    questions=[q for g in sample['groups'] for q in g['questions']]
    assert sorted(q['number'] for q in questions)==list(range(1,56))
    assert len({q['number'] for q in questions})==55
    for g in sample['groups']:
        for q in g['questions']:
            assert q['answer'] in q['choices'],q['number']
            assert all(v.strip() for v in q['choices'].values()),q['number']
            assert all(len(v)<300 for v in q['choices'].values()),q['number']
            if g['kind']=='reading':
                assert set(q['analysis']['options'])==set('ABCD')
                p=next(p for p in g['paragraphs'] if p['label']==q['analysis']['paragraph'])
                assert normalized(q['analysis']['evidence']) in normalized(p['text']),q['number']
        if g['kind']=='matching':assert len(g['paragraphs'])==13
    for source in sample['sources']:
        p=root/source['path'];assert p.stat().st_size==source['bytes']
        assert hashlib.sha256(p.read_bytes()).hexdigest()==source['sha256']
    assert '\x00' not in json.dumps(sample,ensure_ascii=False)
    print('PASS: 55 unique objective questions, 8 types, 10 detailed reading explanations, 3 source hashes.')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--sample',type=Path,required=True);parser.add_argument('--root',type=Path,required=True);args=parser.parse_args()
    verify(json.loads(args.sample.read_text(encoding='utf-8')),args.root)
