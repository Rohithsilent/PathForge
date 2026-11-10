from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
from lxml import etree
import os, re, copy
PPTX=Path('.pathforge-output/PathForge_Project_Presentation.pptx')
TMP=PPTX.with_suffix('.tmp.pptx')
NS={
 'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
 'p':'http://schemas.openxmlformats.org/presentationml/2006/main',
 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
 'rel':'http://schemas.openxmlformats.org/package/2006/relationships',
}
for k,v in NS.items():
    if k!='rel': etree.register_namespace(k,v)
A='{%s}'%NS['a'];P='{%s}'%NS['p'];R='{%s}'%NS['r'];REL='{%s}'%NS['rel']
HYPERLINK_TYPE='http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'
BLUE='0563C1'

def shape_name(s):
    nv=s.find('p:nvSpPr/p:cNvPr',NS)
    return nv.get('name') if nv is not None else ''

def replace_font_declarations(root):
    changes=0
    for el in root.iter():
        for k,v in list(el.attrib.items()):
            if k.endswith('typeface') and v=='Arial':
                el.set(k,'Times New Roman');changes+=1
    return changes

def run_with_text(parent, text, base_rpr, url=None, rid=None):
    run=etree.SubElement(parent,A+'r')
    rp=copy.deepcopy(base_rpr) if base_rpr is not None else etree.Element(A+'rPr',lang='en-US',sz='1200')
    rp.tag=A+'rPr'
    for el in list(rp):
        if el.tag==A+'solidFill': rp.remove(el)
        elif el.tag==A+'u': rp.remove(el)
        elif el.tag==A+'hlinkClick': rp.remove(el)
    for el in list(rp):
        if el.tag==A+'latin': el.set('typeface','Times New Roman')
    if url:
        sf=etree.Element(A+'solidFill');etree.SubElement(sf,A+'srgbClr',val=BLUE)
        rp.insert(0,sf)
        rp.set('u','sng')
        if rid: etree.SubElement(rp,A+'hlinkClick',{R+'id':rid})
    run.append(rp)
    etree.SubElement(run,A+'t').text=text
    return run

with ZipFile(PPTX,'r') as zin:
    parts={n:zin.read(n) for n in zin.namelist()}

# Remove the Notion citation and restyle the remaining references as numbered entries with blue clickable URLs.
slide_path='ppt/slides/slide23.xml'
root=etree.fromstring(parts[slide_path])
body=next(s.find('p:txBody',NS) for s in root.findall('.//p:sp',NS) if shape_name(s)=='TextBox 3')
paras=body.findall('a:p',NS)
refs=[]
for p in paras:
    txt=''.join(t.text or '' for t in p.findall('.//a:t',NS)).strip()
    if txt and not txt.startswith('5. Notion,'):
        txt=re.sub(r'^\d+\.\s*','',txt)
        # Replace bare DOI labels with canonical clickable DOI URLs.
        txt=re.sub(r'doi:\s*(10\.\d{4,9}/[^\s]+)',r'https://doi.org/\1',txt)
        refs.append(txt)
# discard old reference paragraphs, leave body settings and list style untouched
for p in paras: body.remove(p)
# Keep the existing 12 pt run style and paragraph style.
template=paras[0]
ppr=template.find('a:pPr',NS);rpr=template.find('a:r/a:rPr',NS);end=template.find('a:endParaRPr',NS)
rels_path='ppt/slides/_rels/slide23.xml.rels'
if rels_path in parts:
    relroot=etree.fromstring(parts[rels_path])
else:
    relroot=etree.Element(REL+'Relationships',nsmap={None:NS['rel']})
ids=[]
for rel in relroot:
    m=re.fullmatch(r'rId(\d+)',rel.get('Id',''))
    if m: ids.append(int(m.group(1)))
next_id=max(ids or [0])+1
for i,text in enumerate(refs,1):
    p=etree.Element(A+'p')
    if ppr is not None:p.append(copy.deepcopy(ppr))
    numbered=f'{i}. {text}'
    urls=list(re.finditer(r'https?://[^\s]+',numbered))
    pos=0
    for m in urls:
        if m.start()>pos:run_with_text(p,numbered[pos:m.start()],rpr)
        url=m.group(0).rstrip('.,;')
        suffix=m.group(0)[len(url):]
        rid=f'rId{next_id}';next_id+=1
        relroot.append(etree.Element(REL+'Relationship',Id=rid,Type=HYPERLINK_TYPE,Target=url,TargetMode='External'))
        run_with_text(p,url,rpr,url,rid)
        if suffix:run_with_text(p,suffix,rpr)
        pos=m.end()
    if pos<len(numbered):run_with_text(p,numbered[pos:],rpr)
    if end is not None:p.append(copy.deepcopy(end))
    body.append(p)
parts[slide_path]=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
parts[rels_path]=etree.tostring(relroot,xml_declaration=True,encoding='UTF-8',standalone=True)

# Standardize explicit font declarations throughout the package. Theme major/minor fonts are included,
# so inherited text also resolves to Times New Roman. Run sizes and shape geometry are untouched.
font_edits=0
for name,data in list(parts.items()):
    if name.endswith('.xml'):
        root=etree.fromstring(data)
        n=replace_font_declarations(root)
        if n:
            font_edits+=n
            parts[name]=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)

with ZipFile(TMP,'w',ZIP_DEFLATED) as zout:
    for name,data in parts.items():zout.writestr(name,data)
os.replace(TMP,PPTX)
print(f'Updated {PPTX}; references={len(refs)}; font declarations changed={font_edits}; URL links={next_id-max(ids or [0])-1}')
