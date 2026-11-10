from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
from pathlib import Path
import copy, os
path=Path('.pathforge-output/PathForge_Project_Presentation.pptx')
tmp=path.with_suffix('.tmp.pptx')
NS={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
for p,u in NS.items(): etree.register_namespace(p,u)
A='{%s}'%NS['a'];P='{%s}'%NS['p']

def set_cell(tc, text):
    tx=tc.find('a:txBody',NS); p=tx.find('a:p',NS)
    for child in list(p):
        if child.tag != A+'pPr': p.remove(child)
    ep=p.find('a:endParaRPr',NS)
    if ep is None:
        ep=etree.SubElement(p,A+'endParaRPr');ep.set('lang','en-US');ep.set('sz','1200')
        etree.SubElement(ep,A+'latin',typeface='Times New Roman')
    run=etree.Element(A+'r');rp=copy.deepcopy(ep);rp.tag=A+'rPr';run.append(rp)
    etree.SubElement(run,A+'t').text=text
    p.insert(len(p)-1 if len(p) and p[-1].tag==A+'endParaRPr' else len(p),run)

def name_of(sp):
    nv=sp.find('p:nvSpPr/p:cNvPr',NS)
    return nv.get('name') if nv is not None else ''

with ZipFile(path,'r') as zin:
    parts={n:zin.read(n) for n in zin.namelist()}
    # Replace literature table content with two papers requested plus the earlier cited examples.
    r=etree.fromstring(parts['ppt/slides/slide10.xml'])
    rows=r.find('.//a:tbl',NS).findall('a:tr',NS)
    literature=[
      ('Career Craft AI (IEEE, 2024)','Applies NLP and profile classification with SVM / cosine similarity for resume advice and job recommendations.','Starts from resume/profile data; PathForge adds repository-derived evidence and source-linked skill nodes.'),
      ('AI-Powered Skill Gap Analysis… (IEEE, 2026)','Combines rule-based extraction, ontology role mapping, and sentence embeddings to identify missing skills and suggest learning resources.','Similar skill-gap goal; PathForge builds its profile from GitHub project evidence and connects skills, sources, roles, and readiness.'),
      ('Herath et al. (IEEE, 2025): AI interviews','Uses interview analysis and emotion recognition for feedback and career suggestions.','Interview-centered; PathForge focuses on portfolio evidence, role comparison, and learning steps.'),
      ('MockMate (IEEE, 2025) and Pasaribu et al. (IEEE, 2024)','Study AI-assisted interview practice and LLM-based IT interview support.','Interview-centered prior work; PathForge adds an evidence-linked developer skill graph and readiness workflow.'),
    ]
    for row, vals in zip(rows[1:],literature):
        for tc,val in zip(row.findall('a:tc',NS),vals): set_cell(tc,val)
    parts['ppt/slides/slide10.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Append complete IEEE citations to the existing references body; preserve all current references and styles.
    r=etree.fromstring(parts['ppt/slides/slide23.xml'])
    target=next(s for s in r.findall('.//p:sp',NS) if name_of(s)=='TextBox 3')
    body=target.find('p:txBody',NS); old=body.findall('a:p',NS); template=old[-1]
    ppr=template.find('a:pPr',NS); rpr=template.find('a:r/a:rPr',NS); end=template.find('a:endParaRPr',NS)
    citations=[
      '“Career Craft AI: A Personalized Resume Analysis and Job Recommendations System,” in Proc. 2024 1st International Conference on Innovative Sustainable Technologies for Energy, Mechatronics, and Smart Systems (ISTEMS), Dehradun, India, 2024, doi: 10.1109/ISTEMS60181.2024.10560126.',
      'V. Abishek Narayan and A. Rajalakshmi, “AI-Powered Skill Gap Analysis and Career Path Recommendation System Using Hybrid Semantic and Ontology-Based Matching,” in Proc. 2026 International Conference on Data Science and Business Systems (ICDSBS), Singapore, 2026, doi: 10.1109/ICDSBS69077.2026.11634695.'
    ]
    for cite in citations:
        p=etree.Element(A+'p')
        if ppr is not None:p.append(copy.deepcopy(ppr))
        run=etree.SubElement(p,A+'r')
        if rpr is not None:run.append(copy.deepcopy(rpr))
        etree.SubElement(run,A+'t').text=cite
        if end is not None:p.append(copy.deepcopy(end))
        body.append(p)
    parts['ppt/slides/slide23.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    with ZipFile(tmp,'w',ZIP_DEFLATED) as zout:
        for n,data in parts.items():zout.writestr(n,data)
os.replace(tmp,path)
print(f'Updated {path}')
