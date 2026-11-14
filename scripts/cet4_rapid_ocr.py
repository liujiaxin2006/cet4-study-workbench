"""Local OCR cache only. Originals and production data are never modified."""
from pathlib import Path
import json,argparse,time,re
from concurrent.futures import ProcessPoolExecutor,as_completed
_engines={}
def labels(image,item,base):
 import cv2
 from rapidocr_onnxruntime.main import DEFAULT_CFG_PATH,read_yaml
 from rapidocr_onnxruntime.ch_ppocr_rec import TextRecognizer
 if 'labels' not in _engines:
  cfg=read_yaml(DEFAULT_CFG_PATH)['Rec'];cfg.update(model_path=str(base.parent/'en-rec.onnx'),intra_op_num_threads=2,inter_op_num_threads=1,rec_batch_num=12)
  _engines['labels']=TextRecognizer(cfg)
 prefix=item['file']['sha256']+'-'+str(item['page']);raw=base/'ocr'/(prefix+'.json');fallback=base/'ocr'/(prefix+'-en.json')
 data=json.loads((raw if raw.exists() else fallback).read_text(encoding='utf-8-sig'));words=[dict(w) for l in data['lines'] for w in l['words']];img=cv2.imread(str(image));h,width=img.shape[:2];selected=[];crops=[]
 for index,w in enumerate(words):
  if not(w['x']<width*.2 or width*.38<w['x']<width*.65) or re.search('[\u4e00-\u9fff]',w['text']) or not re.search('[A-Za-z0-9]',w['text']):continue
  x0=max(0,int(w['x'])-2);y0=max(0,int(w['y'])-2);x1=min(width,int(w['x']+w['width'])+3);y1=min(h,int(w['y']+w['height'])+3)
  if x1>x0 and y1>y0:crops.append(img[y0:y1,x0:x1]);selected.append(index)
 recognized,elapsed=_engines['labels'](crops) if crops else ([],0)
 for index,(value,score) in zip(selected,recognized):
  if score>.85:words[index]['text']=value
 return [[[[w['x'],w['y']],[w['x']+w['width'],w['y']],[w['x']+w['width'],w['y']+w['height']],[w['x'],w['y']+w['height']]],w['text'],1] for w in words],elapsed
def process(item):
 from rapidocr_onnxruntime import RapidOCR
 import pymupdf
 f=item['file'];page=item['page'];lang=item['lang'];base=Path(item['base']);out=base/'rapid'/(f['sha256']+'-'+str(page)+'-'+lang+'.json')
 previous=json.loads(out.read_text(encoding='utf8')) if out.exists() else None
 full=item.get('full',False)
 if previous is not None and ((lang=='ch' and (not full or isinstance(previous,dict) and previous.get('labelPass') is False)) or lang=='en' and isinstance(previous,dict) and previous.get('wordBoxes')):return 'cached'
 if (lang=='en' or full) and lang not in _engines:
  options={'intra_op_num_threads':2,'inter_op_num_threads':1,'det_limit_side_len':1200,'use_cls':False}
  if lang=='en':options['rec_model_path']=str(base.parent/'en-rec.onnx')
  _engines[lang]=RapidOCR(**options)
 image=base/'ocr'/(f['sha256']+'-'+str(page)+'.png')
 if not image.exists():
  doc=pymupdf.open(Path(item['root'])/f['path']);doc[page-1].get_pixmap(matrix=pymupdf.Matrix(2,2)).save(image)
 if lang=='ch' and full:result,elapsed=_engines[lang](str(image))
 elif lang=='ch':result,elapsed=labels(image,item,base)
 elif previous is not None:
  import numpy as np,cv2
  from rapidocr_onnxruntime.cal_rec_boxes.main import CalRecBoxes
  old=previous.get('result',[]) if isinstance(previous,dict) else previous;boxes=np.array([r[0] for r in old],dtype=np.float32)
  crops=_engines[lang].get_crop_img_list(cv2.imread(str(image)),boxes);rec,elapsed=_engines[lang].text_rec(crops,True);detailed=CalRecBoxes()(crops,boxes,rec)
  result=[[box.tolist(),row[0],float(row[1]),np.asarray(row[2]).astype(int).tolist(),row[3],[float(v) for v in row[4]]] for box,row in zip(boxes,detailed)]
 else:result,elapsed=_engines[lang](str(image),return_word_box=True)
 payload={'engine':'RapidOCR-1.4.4','model':'ch-PP-OCRv4' if lang=='ch' and full else 'en-PP-OCRv4','labelPass':lang=='ch' and not full,'wordBoxes':lang=='en','sourceHash':f['sha256'],'page':page,'result':result or [],'elapsed':elapsed}
 out.parent.mkdir(exist_ok=True);temp=out.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False),encoding='utf8');temp.replace(out)
 return f['path']+' page '+str(page)+' '+lang
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--jobs',type=Path,required=True);p.add_argument('--root',type=Path,required=True);p.add_argument('--base',type=Path,required=True);p.add_argument('--workers',type=int,default=3);a=p.parse_args();items=json.loads(a.jobs.read_text(encoding='utf8'))
 for item in items:item.update(root=str(a.root.resolve()),base=str(a.base.resolve()))
 t=time.time();count=0
 with ProcessPoolExecutor(max_workers=a.workers) as pool:
  futures={pool.submit(process,j):j for j in items}
  for future in as_completed(futures):
   count+=1
   try:result=future.result()
   except Exception as e:result='ERROR '+str(e)
   print(str(count)+'/'+str(len(items))+' '+result+' elapsed '+str(round(time.time()-t))+'s',flush=True)
