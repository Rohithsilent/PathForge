from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
from pathlib import Path
import copy, os
file=Path('.pathforge-output/PathForge_Project_Presentation.pptx')
tmp=file.with_suffix('.tmp.pptx')
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
for k,v in NS.items(): etree.register_namespace(k,v)
A='{%s}'%NS['a']; P='{%s}'%NS['p']

def shape_name(s):
    x=s.find('p:nvSpPr/p:cNvPr',NS)
    return x.get('name') if x is not None else ''

def set_cell(tc,text):
    tx=tc.find('a:txBody',NS); p=tx.find('a:p',NS)
    for ch in list(p):
        if ch.tag!=A+'pPr': p.remove(ch)
    end=p.find('a:endParaRPr',NS)
    if end is None:
        end=etree.SubElement(p,A+'endParaRPr');end.set('lang','en-US');end.set('sz','1200')
        etree.SubElement(end,A+'latin',typeface='Times New Roman')
    run=etree.Element(A+'r');rp=copy.deepcopy(end);rp.tag=A+'rPr';run.append(rp)
    etree.SubElement(run,A+'t').text=text
    p.insert(len(p)-1 if len(p) and p[-1].tag==A+'endParaRPr' else len(p),run)

refs=[
'1. “Career Craft AI: A Personalized Resume Analysis and Job Recommendations System,” in Proc. 2024 1st International Conference on Innovative Sustainable Technologies for Energy, Mechatronics, and Smart Systems (ISTEMS), Dehradun, India, 2024. doi: 10.1109/ISTEMS60181.2024.10560126.',
'2. “AI-Powered Skill Gap Analysis and Career Path Recommendation System Using Hybrid Semantic and Ontology-Based Matching,” in Proc. 2026 International Conference on Data Science and Business Systems (ICDSBS), Singapore, 2026. doi: 10.1109/ICDSBS69077.2026.11634695.',
'3. GitHub, “REST API endpoints for repositories,” GitHub Docs. https://docs.github.com/en/rest/repos/repos',
'4. GitHub, “REST API endpoints for repository contents,” GitHub Docs. https://docs.github.com/en/rest/repos/contents',
'5. Notion, “Introduction,” Notion API Documentation. https://developers.notion.com/reference/intro',
'6. Neo4j, “Developer Guide,” Neo4j Documentation. https://neo4j.com/docs/',
'7. FastAPI, “FastAPI Documentation.” https://fastapi.tiangolo.com/',
'8. Vercel, “Next.js Documentation.” https://nextjs.org/docs',
'9. OpenRouter, “API Reference.” https://openrouter.ai/docs/api-reference/overview',
'10. Ollama, “API Documentation.” https://docs.ollama.com/api',
'11. 3d-force-graph, “3D Force-Directed Graph,” GitHub repository. https://github.com/vasturiano/3d-force-graph',
]
with ZipFile(file) as zin: parts={n:zin.read(n) for n in zin.namelist()}
# Literature review table now contains only the two IEEE studies plus documentation sources from the new list.
r=etree.fromstring(parts['ppt/slides/slide10.xml']);table=r.find('.//a:tbl',NS);rows=table.findall('a:tr',NS)
set_cell(rows[0].findall('a:tc',NS)[2],'PathForge Connection')
items=[
('Career Craft AI (IEEE, 2024)','Uses NLP and profile classification with SVM / cosine similarity for resume feedback and job recommendations.','PathForge follows the skill-to-role matching goal and adds GitHub repository evidence and source-linked skill nodes.'),
('AI-Powered Skill Gap Analysis (IEEE, 2026)','Combines rule-based skill extraction, ontology role mapping, and sentence embeddings to identify gaps and suggest learning resources.','Supports role matching and gap analysis; PathForge centers its profile on repository evidence and an interactive skill graph.'),
('Framework and AI documentation','Documents Next.js, FastAPI, OpenRouter, Ollama, and the 3D force-graph library used in the project stack.','Supports the web interface, backend API, AI-provider options, and graph visualization.'),
('Source and graph API documentation','Documents GitHub repository/content APIs, Notion API access, and Neo4j graph storage.','Supports repository evidence collection, optional notes, and graph persistence.'),
]
for row,vals in zip(rows[1:],items):
    for cell,text in zip(row.findall('a:tc',NS),vals):set_cell(cell,text)
parts['ppt/slides/slide10.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
# Replace only the references body; keep its shape, dimensions, and 12 pt Times New Roman styling.
r=etree.fromstring(parts['ppt/slides/slide23.xml'])
shape=next(s for s in r.findall('.//p:sp',NS) if shape_name(s)=='TextBox 3')
body=shape.find('p:txBody',NS);old=body.findall('a:p',NS);template=old[-1]
ppr=template.find('a:pPr',NS);rpr=template.find('a:r/a:rPr',NS);end=template.find('a:endParaRPr',NS)
for p in old:body.remove(p)
for text in refs:
    p=etree.Element(A+'p')
    if ppr is not None:p.append(copy.deepcopy(ppr))
    run=etree.SubElement(p,A+'r')
    if rpr is not None:run.append(copy.deepcopy(rpr))
    etree.SubElement(run,A+'t').text=text
    if end is not None:p.append(copy.deepcopy(end))
    body.append(p)
parts['ppt/slides/slide23.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(tmp,'w',ZIP_DEFLATED) as zout:
    for n,data in parts.items():zout.writestr(n,data)
os.replace(tmp,file)
print(f'Updated {file}; {len(refs)} references')
