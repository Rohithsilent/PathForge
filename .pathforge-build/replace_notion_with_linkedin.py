from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree
from pathlib import Path
import os
p=Path('.pathforge-output/PathForge_Project_Presentation.pptx');tmp=p.with_suffix('.tmp.pptx')
A='http://schemas.openxmlformats.org/drawingml/2006/main'
changes={
 'optionally ingest Notion notes and certification records':'analyze LinkedIn profile text and certification records',
 'optionally add Notion notes and certification skills':'analyze LinkedIn profile text and certification skills',
 'Add optional Notion notes and certification records':'Analyze LinkedIn profile text and certification records',
 'Public GitHub repos; optional Notion and certifications':'Public GitHub repos; LinkedIn profile text and certifications',
 'optional Notion notes':'LinkedIn profile text',
 'Notion notes and certification records':'LinkedIn profile text and certification records',
 'Optional Notion notes':'LinkedIn profile text',
}
with ZipFile(p) as zin: parts={n:zin.read(n) for n in zin.namelist()}
updated=[]
for name,data in list(parts.items()):
 if not name.endswith('.xml'):continue
 root=etree.fromstring(data);changed=False
 for el in root.iter(f'{{{A}}}t'):
  if not el.text:continue
  old=el.text;new=old
  for src,dst in changes.items():new=new.replace(src,dst)
  if new!=old:el.text=new;changed=True
 if changed:parts[name]=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True);updated.append(name)
with ZipFile(tmp,'w',ZIP_DEFLATED) as zout:
 for name,data in parts.items():zout.writestr(name,data)
os.replace(tmp,p)
# Verify no slide or notes XML still mentions Notion.
left=[]
with ZipFile(p) as z:
 for name in z.namelist():
  if name.endswith('.xml') and (name.startswith('ppt/slides/') or name.startswith('ppt/notesSlides/')):
   if b'Notion' in z.read(name) or b'notion' in z.read(name):left.append(name)
print('Updated parts:',updated)
print('Notion text left on slides/notes:',left)
if left:raise SystemExit(1)
