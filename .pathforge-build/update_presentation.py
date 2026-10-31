from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree
from pathlib import Path
import shutil, copy, json, hashlib

SRC = Path('/run/media/rohith/Mine/chrome downloads/MJRP-PRC2 T22.pptx')
OUT = Path('/run/media/rohith/Mine/Projects/First_freelance/PathForge/.pathforge-output/PathForge_Project_Presentation.pptx')
OUT.parent.mkdir(parents=True, exist_ok=True)
NS = {
 'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
 'p':'http://schemas.openxmlformats.org/presentationml/2006/main',
}
for prefix, uri in NS.items(): etree.register_namespace(prefix, uri)
A='{%s}'%NS['a']; P='{%s}'%NS['p']

texts = {
 4: ('TextBox 1', ["PathForge is an AI-powered career intelligence platform that builds an evidence-backed developer profile from public GitHub repositories, optional Notion notes, and certifications. It extracts technologies, links them to source projects in an interactive knowledge graph, and compares the profile with a selected role. The system estimates career readiness, prioritizes skill gaps, generates a learning roadmap, and simulates potential skill additions. Its Next.js interface connects to FastAPI services, with optional Neo4j storage and open-weight AI through OpenRouter or local Ollama. PathForge also provides graph exploration, market-demand views, analytics, and a recruiter-oriented profile. Scores are decision-support estimates based on available evidence, not guarantees of skill or hiring outcomes."]),
 6: ('TextBox 1', ["Developer profiles often rely on self-reported skills, while evidence is scattered across code repositories, notes, and certificates. A reviewer must open projects one by one to infer which technologies were used and how much evidence supports each claim. This makes it difficult for students to compare their experience with a target role, identify the most important gaps, or choose a next learning step. PathForge addresses this problem by connecting repository evidence to a skill graph, role requirements, readiness indicators, and a practical roadmap. It focuses on developer portfolio evidence and career planning rather than interview simulation or job application management."]),
 14: ('TextBox 1', ["PathForge covers a developer career-intelligence workflow: analyze public GitHub repositories or a GitHub profile; extract languages and technologies from repository evidence; optionally add Notion notes and certification skills; and connect sources to skills in an interactive graph. Users can select a target role, review a readiness estimate and prioritized gaps, generate a learning roadmap, inspect market-demand and analytics views, and simulate potential skill additions. A recruiter-oriented summary supports profile review. The prototype does not provide interview simulation, automated job applications, or measured hiring outcomes. GitHub access and AI provider availability depend on configuration; local deterministic fallbacks support core demo flows."]),
 24: ('TextBox 5', [
   "PathForge turns project evidence into a structured developer skill profile. GitHub repository analysis identifies languages and technologies and links each skill to its source project; optional Notion notes and certification records add further context. The interactive graph makes these relationships explorable.",
   "For a selected role, PathForge estimates readiness from skill coverage, skill maturity, market alignment, and project depth. It highlights missing role skills and provides AI-assisted explanations, a learning roadmap, analytics, and a what-if simulator. Open-weight models can run through OpenRouter or Ollama, with deterministic fallback behavior when a provider is unavailable.",
   "The prototype demonstrates an evidence-centered workflow from repositories to role comparison and next steps. Its readiness values are estimates that depend on available evidence and project heuristics; they should be validated against real users and hiring outcomes before being treated as predictive measures."
  ]),
}

# helpers

def slide_xml(z, n):
    return etree.fromstring(z.read(f'ppt/slides/slide{n}.xml'))

def shape_by_name(root, name):
    for s in root.findall('.//p:sp', NS):
        nv=s.find('p:nvSpPr/p:cNvPr', NS)
        if nv is not None and nv.get('name')==name: return s
    raise ValueError(f'shape not found: {name}')

def set_shape_paragraphs(shape, lines):
    body=shape.find('p:txBody', NS)
    old=body.findall('a:p', NS)
    base=old[0] if old else etree.Element(A+'p')
    ppr=base.find('a:pPr', NS)
    rpr=base.find('a:r/a:rPr', NS)
    end=base.find('a:endParaRPr', NS)
    # If a textbox contains distinct paragraph styles, retain one style per corresponding paragraph.
    for p in old: body.remove(p)
    for i, text in enumerate(lines):
        template=old[i] if i < len(old) else base
        p=etree.Element(A+'p')
        pp=template.find('a:pPr', NS)
        if pp is not None: p.append(copy.deepcopy(pp))
        rr=template.find('a:r/a:rPr', NS)
        ee=template.find('a:endParaRPr', NS)
        if text:
            run=etree.SubElement(p, A+'r')
            if rr is not None: run.append(copy.deepcopy(rr))
            t=etree.SubElement(run, A+'t'); t.text=text
        if ee is not None: p.append(copy.deepcopy(ee))
        body.append(p)

def set_cell(tc, text):
    tx=tc.find('a:txBody', NS); p=tx.find('a:p', NS)
    for child in list(p):
        if child.tag != A+'pPr': p.remove(child)
    ep=p.find('a:endParaRPr',NS)
    if ep is None:
        ep=etree.SubElement(p,A+'endParaRPr'); ep.set('lang','en-US'); ep.set('sz','1200')
        latin=etree.SubElement(ep,A+'latin');latin.set('typeface','Times New Roman')
    r=etree.Element(A+'r')
    rp=copy.deepcopy(ep); rp.tag=A+'rPr'; rp.attrib.pop('dirty',None)
    r.append(rp); t=etree.SubElement(r,A+'t'); t.text=text
    p.insert(len(p)-1 if p[-1].tag==A+'endParaRPr' else len(p),r)

def emu(inches): return str(round(inches*914400))

def add_shape(root, sid, name, x,y,w,h,text, *, kind='roundRect', fill='F5F7FA', line='3A5F8B', color='1F1F1F', size=1600, bold=False, align='ctr', v_align='ctr', margin=0.10, line_width=19050, italic=False):
    sp=etree.SubElement(root.find('p:cSld/p:spTree',NS),P+'sp')
    nv=etree.SubElement(sp,P+'nvSpPr'); c=etree.SubElement(nv,P+'cNvPr'); c.set('id',str(sid)); c.set('name',name)
    etree.SubElement(nv,P+'cNvSpPr').set('txBox','1'); etree.SubElement(nv,P+'nvPr')
    spr=etree.SubElement(sp,P+'spPr'); xf=etree.SubElement(spr,A+'xfrm'); etree.SubElement(xf,A+'off',x=emu(x),y=emu(y)); etree.SubElement(xf,A+'ext',cx=emu(w),cy=emu(h))
    geom=etree.SubElement(spr,A+'prstGeom',prst=kind); etree.SubElement(geom,A+'avLst')
    if fill=='none': etree.SubElement(spr,A+'noFill')
    else:
        sf=etree.SubElement(spr,A+'solidFill'); etree.SubElement(sf,A+'srgbClr',val=fill)
    ln=etree.SubElement(spr,A+'ln',w=str(line_width))
    if line=='none': etree.SubElement(ln,A+'noFill')
    else:
        sf=etree.SubElement(ln,A+'solidFill'); etree.SubElement(sf,A+'srgbClr',val=line)
    tx=etree.SubElement(sp,P+'txBody'); etree.SubElement(tx,A+'bodyPr',wrap='square',anchor=v_align,lIns=emu(margin),rIns=emu(margin),tIns=emu(margin*.45),bIns=emu(margin*.45)); etree.SubElement(tx,A+'lstStyle')
    p=etree.SubElement(tx,A+'p'); etree.SubElement(p,A+'pPr',algn=align)
    r=etree.SubElement(p,A+'r'); rp=etree.SubElement(r,A+'rPr',lang='en-US',sz=str(size),b='1' if bold else '0',i='1' if italic else '0'); etree.SubElement(rp,A+'solidFill').append(etree.Element(A+'srgbClr',val=color)); etree.SubElement(rp,A+'latin',typeface='Times New Roman'); etree.SubElement(rp,A+'ea',typeface='Times New Roman'); etree.SubElement(rp,A+'cs',typeface='Times New Roman'); t=etree.SubElement(r,A+'t'); t.text=text
    etree.SubElement(p,A+'endParaRPr',lang='en-US',sz=str(size),b='1' if bold else '0')
    return sp

def add_line(root,sid,name,x1,y1,x2,y2,color='3A5F8B',width=28575,arrow=False):
    tree=root.find('p:cSld/p:spTree',NS); cn=etree.SubElement(tree,P+'cxnSp'); nv=etree.SubElement(cn,P+'nvCxnSpPr'); c=etree.SubElement(nv,P+'cNvPr',id=str(sid),name=name); etree.SubElement(nv,P+'cNvCxnSpPr'); etree.SubElement(nv,P+'nvPr')
    pr=etree.SubElement(cn,P+'spPr'); xf=etree.SubElement(pr,A+'xfrm'); etree.SubElement(xf,A+'off',x=emu(min(x1,x2)),y=emu(min(y1,y2))); etree.SubElement(xf,A+'ext',cx=emu(abs(x2-x1)),cy=emu(abs(y2-y1)));
    if (x2-x1)*(y2-y1) < 0: xf.set('flipV','1')
    geom=etree.SubElement(pr,A+'prstGeom',prst='line'); etree.SubElement(geom,A+'avLst'); ln=etree.SubElement(pr,A+'ln',w=str(width)); sf=etree.SubElement(ln,A+'solidFill'); etree.SubElement(sf,A+'srgbClr',val=color)
    if arrow: etree.SubElement(ln,A+'headEnd',type='none',w='med',len='med'); etree.SubElement(ln,A+'tailEnd',type='triangle',w='med',len='med')
    return cn

def add_text(root,sid,name,x,y,w,h,text,size=1500,color='1F1F1F',bold=False,align='l',v='ctr'):
    return add_shape(root,sid,name,x,y,w,h,text,kind='rect',fill='none',line='none',color=color,size=size,bold=bold,align=align,v_align=v,margin=.04,line_width=0)

def next_id(root):
    vals=[int(x.get('id')) for x in root.findall('.//p:cNvPr',NS) if x.get('id','').isdigit()]
    return max(vals or [1])+1

with ZipFile(SRC,'r') as zin:
    entries={n:zin.read(n) for n in zin.namelist()}
    # Preserve slide 1 roster, college identity, guidance, batch, and official institutional text.
    r=etree.fromstring(entries['ppt/slides/slide1.xml'])
    set_shape_paragraphs(shape_by_name(r,'TextBox 1'),['PathForge: AI Career Intelligence Platform'])
    entries['ppt/slides/slide1.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Brand and complete body rewrites on the existing content slides, retaining each original textbox geometry and text style.
    for n,(shape,lines) in texts.items():
        r=etree.fromstring(entries[f'ppt/slides/slide{n}.xml'])
        set_shape_paragraphs(shape_by_name(r,shape),lines)
        entries[f'ppt/slides/slide{n}.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Replace outdated product name in the objectives slide and update the objectives to match the implementation.
    r=etree.fromstring(entries['ppt/slides/slide8.xml'])
    s=shape_by_name(r,'TextBox 1')
    set_shape_paragraphs(s,[
      'PathForge links project evidence to a developer skill profile and a selected career role. It helps students see what their code demonstrates, where evidence is thin, and what to learn next.',
      '', 'Objectives:',
      'Analyze public GitHub repositories and profiles',
      'Extract skills from languages, dependencies, and README evidence',
      'Connect repository evidence to skills in an interactive graph',
      'Add optional Notion notes and certification records',
      'Compare profiles with target roles and estimate readiness',
      'Prioritize gaps and generate a role-focused learning roadmap',
      'Explore skill maturity, categories, and market-demand indicators',
      'Simulate potential skill additions and share a recruiter-oriented profile',
    ])
    entries['ppt/slides/slide8.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Slide 2 outline, without changing its existing textbox dimensions or styling.
    r=etree.fromstring(entries['ppt/slides/slide2.xml'])
    set_shape_paragraphs(shape_by_name(r,'CustomShape 3'),[
      'Abstract','Introduction','Problem Statement & Objectives','Literature Review',
      'Comparative Analysis of Existing Systems','Scope of the Proposed System',
      'Proposed Methodology, Architecture & UML','Execution Outputs','Performance Evaluation','Conclusion'
    ])
    entries['ppt/slides/slide2.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Literature review: populate the native editable table using sources already retained on References slide.
    r=etree.fromstring(entries['ppt/slides/slide10.xml'])
    tbl=r.find('.//a:tbl',NS); rows=tbl.findall('a:tr',NS)
    lit=[
      ('Patel et al. (2024): RAG placement assistant','Uses retrieval-augmented generation for personalized interview preparation.','Interview preparation focus; does not build a repository-linked developer skill graph.'),
      ('Herath et al. (2025): AI interviews','Combines interview interaction, emotion recognition, feedback, and career suggestions.','Evaluates interview behavior rather than evidence across code repositories and skills.'),
      ('MockMate (2025): adaptive interview practice','Applies AI to realistic, adaptive mock interview practice.','Practice-focused; does not provide a persistent skill maturity profile or role gap roadmap.'),
      ('Pasaribu et al. (2024): IT talent interviews','Applies an LLM to IT interview support.','Interview-centric; not a cross-source portfolio graph or readiness assessment.'),
    ]
    for row, vals in zip(rows[1:],lit):
        for tc,val in zip(row.findall('a:tc',NS),vals): set_cell(tc,val)
    entries['ppt/slides/slide10.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Comparative analysis: editable matrix, carefully framed as typical platform focus (coverage varies by product).
    r=etree.fromstring(entries['ppt/slides/slide12.xml']); sid=next_id(r)
    x0=.48; y0=1.28; widths=[2.05,2.35,2.35,2.35]; gap=.05; hh=.50; rh=1.08
    headers=['System Type','Evidence Used','Typical Output','PathForge Difference']
    rows=[
      ['Job / opportunity platforms','Profile fields, search filters, vacancy text','Opportunity discovery and matching','Adds a persistent skill profile linked to project evidence.'],
      ['Resume / ATS tools','Resume text and declared experience','Keyword checks and resume feedback','Adds repo-derived skills and source-to-skill links.'],
      ['Interview practice systems','Interview answers, audio, or video','Practice and interview feedback','Focuses on portfolio evidence, role gaps, and learning actions.'],
      ['PathForge prototype','Public GitHub repos; optional Notion and certifications','3D skill graph, readiness estimate, gaps, roadmap, analytics','Connects evidence, role comparison, and next steps in one workflow.'],
    ]
    x=x0
    for j,(w,txt) in enumerate(zip(widths,headers)):
        add_shape(r,sid,f'Comparison header {j+1}',x,y0,w,hh,txt,fill='7030A0',line='7030A0',color='FFFFFF',size=1400,bold=True);sid+=1;x+=w+gap
    for i,row in enumerate(rows):
        x=x0; y=y0+hh+.04+i*(rh+.04)
        for j,(w,txt) in enumerate(zip(widths,row)):
            fill='EDF1F7' if i%2==0 else 'F8F9FB'
            if i==3: fill='E9E2F1'
            add_shape(r,sid,f'Comparison row {i+1} cell {j+1}',x,y,w,rh,txt,fill=fill,line='3A5F8B',color='1F1F1F',size=1250,bold=(j==0 or i==3),align='l',margin=.09);sid+=1;x+=w+gap
    entries['ppt/slides/slide12.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Proposed methodology: fill the existing editable table, preserving the original 18 pt Times New Roman body styling.
    r=etree.fromstring(entries['ppt/slides/slide16.xml']); rows=r.find('.//a:tbl',NS).findall('a:tr',NS)
    methods=[
      ('Data acquisition','Read GitHub repository metadata, languages, manifests, README, and topics; optionally ingest Notion notes and certification records.'),
      ('Evidence extraction','Combine GitHub language/dependency signals and the technology directory with AI skill extraction; cache model responses and fall back to deterministic extraction.'),
      ('Knowledge graph','Create repository and skill nodes with source links; classify skills and attach maturity and market-demand indicators.'),
      ('Career assessment','Compare graph skills with role requirements; calculate readiness, prioritize gaps, and generate a roadmap and what-if estimate.'),
    ]
    for row,vals in zip(rows[1:],methods):
        for tc,val in zip(row.findall('a:tc',NS),vals): set_cell(tc,val)
    entries['ppt/slides/slide16.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Architecture diagram on the blank architecture slide; editable native PowerPoint shapes and connectors.
    r=etree.fromstring(entries['ppt/slides/slide17.xml']); sid=next_id(r)
    colx=[.48,3.62,6.82]; colw=[2.38,2.48,2.70]; y=1.55; h=1.40
    add_shape(r,sid,'Architecture Sources',colx[0],y,colw[0],h,'INPUTS\nGitHub repositories\nOptional Notion notes\nCertifications',fill='EDF1F7',line='3A5F8B',color='1F1F1F',size=1550,bold=False); sid+=1
    add_shape(r,sid,'Architecture API',colx[1],y,colw[1],h,'APPLICATION API\nFastAPI routes\nProfile, graph, career, chat',fill='E9E2F1',line='7030A0',color='1F1F1F',size=1550,bold=False); sid+=1
    add_shape(r,sid,'Architecture Services',colx[2],y,colw[2],h,'ANALYSIS SERVICES\nRepo analyzer + skill extraction\nScoring + roadmap + analytics',fill='EDF1F7',line='3A5F8B',color='1F1F1F',size=1450,bold=False); sid+=1
    add_line(r,sid,'Sources to API',2.88,2.22,3.62,2.22,arrow=True); sid+=1
    add_line(r,sid,'API to Services',6.10,2.22,6.82,2.22,arrow=True); sid+=1
    add_shape(r,sid,'Architecture AI',.75,3.52,3.75,1.12,'OPEN-WEIGHT AI\nOpenRouter or local Ollama; deterministic fallback when unavailable',fill='F8F9FB',line='7030A0',color='1F1F1F',size=1450);sid+=1
    add_shape(r,sid,'Architecture Storage',5.50,3.52,3.75,1.12,'GRAPH STORAGE\nNeo4j when configured; local JSON / in-memory fallback',fill='F8F9FB',line='3A5F8B',color='1F1F1F',size=1450);sid+=1
    add_line(r,sid,'Services to AI',7.9,2.95,3.4,3.52,color='7030A0');sid+=1
    add_line(r,sid,'Services to Storage',8.0,2.95,7.4,3.52);sid+=1
    add_shape(r,sid,'Architecture Outputs',.75,5.20,8.50,1.12,'USER OUTPUTS\nInteractive 3D skill graph  •  readiness + prioritized gaps  •  roadmap + what-if  •  analytics + recruiter view',fill='3A5F8B',line='3A5F8B',color='FFFFFF',size=1500,bold=True);sid+=1
    add_line(r,sid,'Storage to outputs',7.4,4.64,7.4,5.20);sid+=1
    entries['ppt/slides/slide17.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # UML Use Case: student and recruiter actors connected to implemented system actions.
    r=etree.fromstring(entries['ppt/slides/slide18.xml']); sid=next_id(r)
    # System boundary and title
    add_shape(r,sid,'System boundary',2.45,1.26,6.65,5.22,'',kind='rect',fill='none',line='7030A0',line_width=28575);sid+=1
    add_text(r,sid,'System boundary label',2.60,1.30,2.0,.32,'PathForge',size=1600,color='7030A0',bold=True);sid+=1
    # Use cases
    ucs=[('Analyze repository',4.05,1.78),('Explore evidence graph',4.05,2.58),('Select role + review readiness',4.05,3.38),('Review gaps + roadmap',4.05,4.18),('Run what-if simulation',4.05,4.98),('View recruiter profile',4.05,5.78)]
    for label,x,y in ucs:
        add_shape(r,sid,f'Use case {label}',x,y,3.25,.54,label,kind='ellipse',fill='F5F7FA',line='3A5F8B',color='1F1F1F',size=1350);sid+=1
    # Student stick figure outside boundary, left
    add_shape(r,sid,'Student actor head',.88,3.18,.34,.34,'',kind='ellipse',fill='none',line='1F1F1F',line_width=19050);sid+=1
    add_line(r,sid,'Student torso',1.05,3.52,1.05,4.25,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Student arms',.67,3.78,1.43,3.78,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Student left leg',1.05,4.25,.72,4.72,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Student right leg',1.05,4.25,1.38,4.72,color='1F1F1F',width=19050);sid+=1
    add_text(r,sid,'Student label',.45,4.82,1.25,.36,'Student / Developer',size=1200,color='1F1F1F',bold=True,align='ctr');sid+=1
    for i,(_,x,y) in enumerate(ucs): add_line(r,sid,f'Student association {i+1}',1.43,3.78,4.05,y+.27,color='7C8998',width=12700);sid+=1
    # Recruiter actor right side, connected to shareable profile.
    add_shape(r,sid,'Recruiter actor head',9.36,4.10,.34,.34,'',kind='ellipse',fill='none',line='1F1F1F',line_width=19050);sid+=1
    add_line(r,sid,'Recruiter torso',9.53,4.44,9.53,5.17,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Recruiter arms',9.14,4.68,9.88,4.68,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Recruiter left leg',9.53,5.17,9.22,5.60,color='1F1F1F',width=19050);sid+=1
    add_line(r,sid,'Recruiter right leg',9.53,5.17,9.85,5.60,color='1F1F1F',width=19050);sid+=1
    add_text(r,sid,'Recruiter label',8.92,5.72,.96,.36,'Recruiter',size=1200,color='1F1F1F',bold=True,align='ctr');sid+=1
    add_line(r,sid,'Recruiter profile association',9.14,4.68,7.30,6.05,color='7C8998',width=12700);sid+=1
    # Keep associations behind use-case and actor text so lines never obscure labels.
    tree=r.find('p:cSld/p:spTree',NS); kids=list(tree); fixed=kids[:2]; rest=kids[2:]
    tree[:] = fixed + [x for x in rest if x.tag==P+'cxnSp'] + [x for x in rest if x.tag!=P+'cxnSp']
    entries['ppt/slides/slide18.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Execution output: representative seeded demo view, labeled as demo data, not a real user's result.
    r=etree.fromstring(entries['ppt/slides/slide19.xml']);sid=next_id(r)
    add_shape(r,sid,'Demo dashboard frame',.48,1.25,9.02,5.65,'',kind='rect',fill='FFFFFF',line='3A5F8B',line_width=28575);sid+=1
    add_shape(r,sid,'Demo dashboard header',.48,1.25,9.02,.56,'PATHFORGE DASHBOARD  |  BUNDLED DEMO SCENARIO',kind='rect',fill='7030A0',line='7030A0',color='FFFFFF',size=1500,bold=True);sid+=1
    add_shape(r,sid,'Demo graph panel',.68,2.00,5.30,3.77,'',kind='rect',fill='F5F7FA',line='3A5F8B',color='1F1F1F',size=1450,bold=True);sid+=1
    add_text(r,sid,'Demo graph title',.82,2.08,5.02,.34,'EVIDENCE-LINKED SKILL GRAPH',size=1400,color='7030A0',bold=True,align='ctr');sid+=1
    # Demonstrative graph points and links
    nodes=[('orbit-dashboard',1.28,3.13,'7030A0'),('React',2.75,2.70,'3A5F8B'),('TypeScript',2.83,3.68,'3A5F8B'),('studyhub-api',1.28,4.62,'7030A0'),('Node.js',4.20,3.09,'3A5F8B'),('MongoDB',4.25,4.14,'3A5F8B')]
    coords={}
    for label,x,y,col in nodes:
        add_shape(r,sid,f'Demo graph node {label}',x,y,1.18,.40,label,kind='ellipse',fill=col,line=col,color='FFFFFF',size=1050,bold=True);sid+=1;coords[label]=(x,y)
    for src,dst in [('orbit-dashboard','React'),('orbit-dashboard','TypeScript'),('studyhub-api','Node.js'),('studyhub-api','MongoDB')]:
        x1,y1=coords[src];x2,y2=coords[dst];add_line(r,sid,f'Demo graph link {src} {dst}',x1+1.18,y1+.20,x2,y2+.20,color='9AA6B2',width=12700);sid+=1
    add_shape(r,sid,'Demo readiness score',6.22,2.00,3.02,1.55,'58%\nCareer readiness\nTarget role: ML Engineer',fill='E9E2F1',line='7030A0',color='1F1F1F',size=1800,bold=True);sid+=1
    add_shape(r,sid,'Demo prioritized gaps',6.22,3.78,3.02,1.99,'PRIORITY GAPS\nPyTorch\nscikit-learn\nDocker\nTensorFlow',fill='EDF1F7',line='3A5F8B',color='1F1F1F',size=1450,bold=False,align='l');sid+=1
    add_text(r,sid,'Graph link note',.75,5.80,5.25,.30,'Repository nodes connect to technologies detected in project evidence.',size=1100,color='4B5563',bold=False,align='l');sid+=1
    add_text(r,sid,'Demo output note',.68,6.15,8.55,.45,'Seeded demo profile (Aryan Sharma): illustrative output from backend/seed_data.py; not a measured user study.',size=1150,color='4B5563',bold=False,align='l');sid+=1
    # Place graph links over the graph panel background but below its nodes and labels.
    tree=r.find('p:cSld/p:spTree',NS); kids=list(tree); fixed=kids[:2]; rest=kids[2:]
    def nm(el):
        q=el.find('p:nvSpPr/p:cNvPr',NS) if el.tag==P+'sp' else el.find('p:nvCxnSpPr/p:cNvPr',NS)
        return q.get('name','') if q is not None else ''
    bg_names={'Demo dashboard frame','Demo dashboard header','Demo graph panel'}
    bg=[x for x in rest if nm(x) in bg_names]
    links=[x for x in rest if nm(x).startswith('Demo graph link ')]
    others=[x for x in rest if x not in bg and x not in links]
    tree[:] = fixed + bg + links + others
    entries['ppt/slides/slide19.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # Performance evaluation: truthful evaluation framework; no unrecorded benchmark/user-study results are invented.
    r=etree.fromstring(entries['ppt/slides/slide20.xml']);sid=next_id(r)
    add_text(r,sid,'Evaluation framing',.50,1.10,9.0,.42,'Functional evaluation plan — the repository contains no measured benchmark or user-study results.',size=1350,color='7030A0',bold=True,align='l');sid+=1
    x0=.50;y0=1.68;widths=[2.05,3.35,3.50];gap=.05;hh=.46;rh=.88
    headers=['Objective','Evidence / method','Reportable measure']
    rows=[
      ['Repository analysis','Run valid and invalid public GitHub URLs; inspect extracted language and dependency evidence.','Successful analyses / attempts; relevant-skill precision on a manually reviewed sample.'],
      ['Skill graph','Check repo-to-skill links and source labels against repository files.','Link correctness; missing or unsupported skill rate.'],
      ['Readiness + gaps','Compare score components and role-required skills with a hand-checked profile.','Coverage, maturity, demand, depth components; gap agreement with reviewer.'],
      ['Roadmap + what-if','Check that suggested phases address selected role gaps and inputs affect estimates.','Actionable roadmap rating; response time; repeatability across runs.'],
      ['Reliability','Repeat with AI provider enabled, unavailable, and local fallback configured.','Completion rate, latency by provider, cache hit rate, fallback success.'],
    ]
    for j,(w,txt) in enumerate(zip(widths,headers)):
        add_shape(r,sid,f'Evaluation header {j+1}',x0+sum(widths[:j])+j*gap,y0,w,hh,txt,fill='7030A0',line='7030A0',color='FFFFFF',size=1300,bold=True);sid+=1
    for i,row in enumerate(rows):
        y=y0+hh+.03+i*(rh+.03)
        for j,(w,txt) in enumerate(zip(widths,row)):
            fill='EDF1F7' if i%2==0 else 'F8F9FB'
            x=x0+sum(widths[:j])+j*gap
            add_shape(r,sid,f'Evaluation row {i+1} cell {j+1}',x,y,w,rh,txt,fill=fill,line='3A5F8B',color='1F1F1F',size=1150,bold=(j==0),align='l',margin=.07);sid+=1
    add_shape(r,sid,'Readiness formula',.50,6.60,9.0,.42,'Readiness = 0.40 × skill coverage + 0.30 × average maturity + 0.20 × market alignment + 0.10 × project depth',kind='rect',fill='E9E2F1',line='7030A0',color='1F1F1F',size=1200,bold=True,margin=.04);sid+=1
    entries['ppt/slides/slide20.xml']=etree.tostring(r,xml_declaration=True,encoding='UTF-8',standalone=True)

    # All unnamed references and official college/student details remain unchanged.
    with ZipFile(OUT,'w',ZIP_DEFLATED) as zout:
        for name,data in entries.items(): zout.writestr(name,data)

print(json.dumps({'output':str(OUT),'bytes':OUT.stat().st_size,'slides':sum(1 for n in entries if n.startswith('ppt/slides/slide') and n.endswith('.xml')),'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(OUT.read_bytes()).hexdigest()},indent=2))
