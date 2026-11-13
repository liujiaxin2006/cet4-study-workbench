"""Native PDF extraction with resumable Windows OCR jobs. Read-only originals."""
from pathlib import Path
import argparse,json,re,sys
import pymupdf
from cet4_pipeline import set_number

def extract(root,inventory,out,ocr=False):
    out.mkdir(parents=True,exist_ok=True);cache=out/'ocr';cache.mkdir(exist_ok=True)
    inv=json.loads(inventory.read_text(encoding='utf8'));candidates={}
    for f in inv['files']:
        if f['extension']!='.pdf':continue
        key=(f['exam'],set_number(f['path']),f['category'])
        if key not in candidates or f.get('textChars',0)>candidates[key].get('textChars',0):candidates[key]=f
    jobs=[];complete=0
    for f in inv['files']:
        if f['extension']!='.pdf':
            if f['extension']=='.md':(out/(f['sha256']+'.txt')).write_text((root/f['path']).read_text(encoding='utf8'),encoding='utf8')
            continue
        doc=pymupdf.open(root/f['path']);pages=[]
        chosen=f in candidates.values()
        for i,page in enumerate(doc):
            text=page.get_text(sort=False)
            if len(re.findall('[A-Za-z\u4e00-\u9fff]',text))<40:
                target=cache/(f['sha256']+'-'+str(i+1)+'.json')
                if target.exists():
                    data=json.loads(target.read_text(encoding='utf-8-sig'));english=target.with_name(target.stem+'-en.json')
                    if english.exists():
                        en=json.loads(english.read_text(encoding='utf-8-sig'))
                        def span(line):
                            words=line.get('words',[])
                            return (min((w['y'] for w in words),default=0),max((w['y']+w['height'] for w in words),default=0))
                        cn=[line for line in data['lines'] if len(re.findall('[\u4e00-\u9fff]',line['text']))>len(re.sub(r'\s','',line['text']))*.45]
                        lines=cn+[line for line in en['lines'] if not any(min(span(line)[1],span(c)[1])-max(span(line)[0],span(c)[0])>(span(line)[1]-span(line)[0])*.5 for c in cn)]
                        lines.sort(key=lambda line:span(line)[0]);text='\n'.join(line['text'] for line in lines)
                    else:text='\n'.join(line['text'] for line in data['lines'])
                    complete+=1
                elif ocr and chosen:
                    image=cache/(f['sha256']+'-'+str(i+1)+'.png')
                    if not image.exists():page.get_pixmap(matrix=pymupdf.Matrix(2,2)).save(image)
                    jobs.append({'image':str(image.resolve()),'output':str(target.resolve()),'source':f['path'],'page':i+1})
            pages.append(text)
        (out/(f['sha256']+'.txt')).write_text('\n\f\n'.join(pages),encoding='utf8')
    (out/'ocr-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False),encoding='utf8')
    print(json.dumps({'pendingOcrPages':len(jobs),'cachedOcrPages':complete},ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--inventory',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--ocr',action='store_true');a=p.parse_args();extract(a.root,a.inventory,a.out,a.ocr)
