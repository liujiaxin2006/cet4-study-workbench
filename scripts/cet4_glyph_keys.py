"""Recover printed answer labels in BookMaker PDFs with broken Unicode maps.

The reference alphabet was visually checked against the supplied 2017.06 answer
PDF. Matching actual expanded glyph outlines, not encrypted character codes,
allows other subsets to be decoded without guessing an answer from its meaning.
Only same-line numbered answer labels are returned; full option lists are not keys.
"""
import hashlib,json,re
from io import BytesIO
from functools import lru_cache
import pymupdf
from fontTools.cffLib import CFFFontSet
from fontTools.pens.recordingPen import RecordingPen

REFERENCE='badee5d5f999b9dd3a2ec0be057d1c4315370fdc4dad30868c645b2db13e3611'
ALPHABET={34:'A',35:'P',36:'1',37:'.',38:'T',39:'h',40:'e',41:'s',42:'l',43:'f',44:'-',45:'d',46:'r',47:'i',48:'v',49:'n',50:'g',51:'y',52:'t',53:'m',54:'w',55:'a',56:'u',57:'C',58:'c',59:'b',60:'B',61:'o',62:'p',63:'D',64:'j',65:'2',66:'q',67:'3',68:'H',69:'k',70:'4',71:'x',72:'5',73:'6',74:'7',75:'F',76:'8',77:'9',78:'I',79:'W',81:'0',82:'L',83:'G',84:'S',85:'O',86:'E',87:'V',88:'M',89:'N',90:'%',91:'J',92:'K',93:'z',94:'U',95:'Y',97:'R',98:'$'}
BOLD={33:'2',34:'0',35:'1',36:'7',37:'6',38:'P',39:'a',40:'r',41:'t',42:'W',43:'i',44:'n',45:'g',46:'3',47:'m',48:'u',49:'e',50:'s',51:'D',52:'c',53:'o',54:'L',55:'C',56:'p',57:'h',58:'5',59:'Q',60:'d',61:'b',62:'w',63:'y',64:'v',65:'j',66:'.',67:'4',68:'8',69:'9',70:'R',71:'f',72:'l',73:'T',74:'B',75:'N',76:'F',77:'O',78:'A',79:'S',80:'-',81:'k',82:'I',83:'G',84:'?',85:'H',86:"'",87:'M',88:'q',89:'x',90:'J',91:'E',92:'K',93:'V'}

def font(data):
 c=CFFFontSet();c.decompile(BytesIO(data),None);return c[c.fontNames[0]]

def outline(top,name):
 pen=RecordingPen();top.CharStrings[name].draw(pen)
 return hashlib.sha256(json.dumps(pen.value,separators=(',',':')).encode()).hexdigest()

def reference_shapes(root,files):
 f=next((f for f in files if f['sha256']==REFERENCE),None)
 if not f:return {}
 doc=pymupdf.open(root/f['path']);shapes={}
 for suffix,alphabet in [('FzBookMaker9DlFont9',ALPHABET),('FzBookMaker3DlFont3',BOLD)]:
  info=next(x for p in doc for x in p.get_fonts() if x[3].endswith('+'+suffix));top=font(doc.extract_font(info[0])[3])
  for code,char in alphabet.items():
   name=top.Encoding[code]
   if name!='.notdef':shapes[outline(top,name)]=char
 info=next(x for p in doc for x in p.get_fonts() if x[3].split('+')[-1].startswith('FzBookMaker1DlFont1'))
 top=font(doc.extract_font(info[0])[3]);shapes[outline(top,top.Encoding[34])]=')'
 return shapes

def glyph_header_keys(root,f,shapes):
 if not shapes or f['extension']!='.pdf':return {}
 from cet4_prepare import answer_layout
 doc=pymupdf.open(root/f['path']);maps={};headers={};records={}
 for pageNo,page in enumerate(doc,1):
  for info in page.get_fonts():
   name=info[3].split('+')[-1]
   if name in maps:continue
   maps[name]={}
   if info[1]!='cff' or 'FzBookMaker' not in name:continue
   try:
    top=font(doc.extract_font(info[0])[3])
    encoded=list(enumerate(top.Encoding));encoded=encoded[:80] if len(top.charset)>130 else encoded
    decoded={i:shapes.get(outline(top,g)) for i,g in encoded if g!='.notdef'}
    if sum(bool(v) for v in decoded.values())>=10 or ')' in decoded.values():maps[name]={k:v for k,v in decoded.items() if v}
   except (ValueError,KeyError,AttributeError):continue
  chars=[]
  for span in page.get_texttrace():
   candidates=[v for k,v in maps.items() if k==span['font'] or k.startswith(span['font'])]
   mapping=candidates[0] if candidates and all(v==candidates[0] for v in candidates) else {}
   if not mapping:continue
   for c in span['chars']:
    value=mapping.get(c[0])
    if not value:continue
    x,y,x1,y1=c[3];chars.append({'text':value,'x':x,'y':y,'width':x1-x,'height':y1-y})
  rows=[]
  for c in sorted(chars,key=lambda c:c['y']+c['height']/2):
   cy=c['y']+c['height']/2
   if rows and abs(rows[-1][0]-cy)<c['height']*.3:rows[-1][1].append(c)
   else:rows.append((cy,[c]))
  words=[]
  for _,row in rows:
   run=None
   for c in sorted(row,key=lambda c:c['x']):
    if run and c['x']-(run['x']+run['width'])<c['height']*.18:
     run['text']+=c['text'];run['width']=c['x']+c['width']-run['x']
    else:run=dict(c);words.append(run)
  raw=answer_layout(words,page.rect.width) if words else ''
  for m in re.finditer(r'(?m)^[ \t]*(\d{1,2})[ \t.]*([A-P])[ \t]*\)',raw):
   n=int(m[1]);letter=m[2]
   if not 1<=n<=55 or letter not in ('ABCD' if n<=25 or n>=46 else 'ABCDEFGHIJKLMNO' if n<=35 else 'ABCDEFGHIJKLMNOP'):continue
   records.setdefault(n,[]).append({'answer':letter,'page':pageNo,'method':'visually-checked-glyph-outline-header','header':raw[m.start():].splitlines()[0][:200]})
  # Matching explanations pair a numbered statement on the left with its
  # explicitly labelled source paragraph on the right, on the same baseline.
  for _,row in rows:
   ordered=sorted(row,key=lambda c:c['x']);left=[c for c in ordered if c['x']<page.rect.width*.35];right=[c for c in ordered if page.rect.width*.35<c['x']<page.rect.width*.65]
   lhs=''.join(c['text'] for c in left);rhs=''.join(c['text'] for c in right)
   nm=re.match(r'^(3[6-9]|4[0-5])\.',lhs);rm=re.findall(r'([A-P])\)',rhs)
   if nm and len(rm)==1:records.setdefault(int(nm[1]),[]).append({'answer':rm[0],'page':pageNo,'method':'visually-checked-glyph-paired-matching-header'})
 return {n:vs[0] for n,vs in records.items() if len({v['answer'] for v in vs})==1}
