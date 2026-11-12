"""Read-only audit of a user-supplied CET corpus. Never modifies source files."""
from pathlib import Path
from collections import Counter, defaultdict
import argparse, hashlib, json, re, subprocess, zipfile, logging, shutil
import xml.etree.ElementTree as ET
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)

def audit(root, output, texts):
    output.parent.mkdir(parents=True, exist_ok=True)
    texts.mkdir(parents=True, exist_ok=True)
    records=[]
    for path in sorted(p for p in root.rglob('*') if p.is_file()):
        relative=path.relative_to(root).as_posix()
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        item={'id':digest[:20], 'path':relative,'exam':relative.split('/')[0],
              'bytes':path.stat().st_size,'sha256':digest,'extension':path.suffix.lower(),
              'category':'audio' if path.suffix.lower()=='.mp3' else 'answer' if '答案' in relative else 'paper',
              'status':'unreviewed','issues':[]}
        text=''
        try:
            if path.suffix.lower()=='.pdf':
                reader=PdfReader(path)
                item['pages']=len(reader.pages)
                if shutil.which('pdftotext'):
                    result=subprocess.run(['pdftotext','-layout','-enc','UTF-8',str(path),'-'],capture_output=True,timeout=60)
                    if result.returncode: raise RuntimeError(result.stderr.decode('utf-8',errors='replace')[:180])
                    text=result.stdout.decode('utf-8',errors='replace')
                else:
                    text='\f'.join(page.extract_text(extraction_mode='layout') or '' for page in reader.pages)
                pages=text.split('\f')
                if text.endswith('\f') and len(pages)>len(reader.pages):pages=pages[:-1]
                item['lowTextPages']=[i+1 for i,p in enumerate(pages) if len(re.findall('[A-Za-z\u4e00-\u9fff]',p))<40]
                if item['lowTextPages']: item['issues'].append('ocr_or_visual_review_required')
            elif path.suffix.lower()=='.docx':
                with zipfile.ZipFile(path) as z:
                    tree=ET.fromstring(z.read('word/document.xml'))
                    text='\n'.join(''.join(p.itertext()) for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))
            elif path.suffix.lower()=='.md': text=path.read_text(encoding='utf-8')
            elif path.suffix.lower()=='.doc': item['issues'].append('legacy_word_conversion_required')
            if text:
                (texts/(digest+'.txt')).write_text(text,encoding='utf-8')
                item['textChars']=len(text.strip())
                normal=re.sub(r'[^a-z0-9\u4e00-\u9fff]','',text.lower())
                if len(normal)>200:item['normalizedTextSha256']=hashlib.sha256(normal.encode()).hexdigest()
        except Exception as exc:item['issues'].append('extraction_error:'+str(exc)[:180])
        records.append(item)
        print(f"{len(records)} {relative} {item.get('textChars',0)}",flush=True)
    exact=defaultdict(list);semantic=defaultdict(list)
    for item in records:
        exact[item['sha256']].append(item['path'])
        if item.get('normalizedTextSha256'):semantic[item['normalizedTextSha256']].append(item['path'])
    result={'schemaVersion':1,'source':'user-supplied-local-corpus','reviewStatus':'inventory-only-not-verified-papers',
        'fileCount':len(records),'totalBytes':sum(x['bytes'] for x in records),
        'extensions':dict(Counter(x['extension'] for x in records)),
        'exactDuplicateGroups':[v for v in exact.values() if len(v)>1],
        'sameNormalizedTextGroups':[v for v in semantic.values() if len(v)>1],
        'sessions':[{ 'exam':exam,'files':len(items),'paperFiles':sum(x['category']=='paper' for x in items),
            'answerFiles':sum(x['category']=='answer' for x in items),'audioFiles':sum(x['category']=='audio' for x in items),
            'filesRequiringReview':sum(bool(x['issues']) for x in items)}
            for exam,items in ((exam,[x for x in records if x['exam']==exam]) for exam in sorted(set(x['exam'] for x in records)))],
        'files':records}
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ['files','sessions']},ensure_ascii=False),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);parser.add_argument('--texts',type=Path,required=True)
    args=parser.parse_args();audit(args.root.resolve(),args.out.resolve(),args.texts.resolve())
