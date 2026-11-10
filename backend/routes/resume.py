"""
Resume upload and analysis routes.
Extracts verified skills, experience, and projects from PDF or pasted resume text,
and merges them into the candidate's knowledge graph.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from schemas.schemas import ResumeTextRequest
from services import resume_service
from services.graph_service import get_graph, save_graph

router = APIRouter(tags=["resume"])


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume file (.pdf, .txt, .md) to extract skills and merge into the graph."""
    filename = file.filename or "resume.pdf"
    lower_name = filename.lower()

    if not (lower_name.endswith(".pdf") or lower_name.endswith(".txt") or lower_name.endswith(".md")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF (.pdf) or text (.txt, .md) file.",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # 10MB safety limit
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")

    try:
        if lower_name.endswith(".pdf"):
            resume_text = resume_service.extract_text_from_pdf(content)
        else:
            resume_text = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        resume_data = resume_service.extract_resume_data(resume_text, filename=filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract skills: {e}")

    # Merge into the existing knowledge graph
    current_graph = get_graph()
    existing_nodes = current_graph.get("nodes", [])
    existing_links = current_graph.get("links", [])

    generated = resume_service.build_resume_graph_nodes(resume_data, existing_nodes)

    existing_ids = {n["id"] for n in existing_nodes}
    merged_nodes = list(existing_nodes)

    for n in generated["nodes"]:
        if n["id"] not in existing_ids:
            merged_nodes.append(n)
            existing_ids.add(n["id"])

    merged_links = list(existing_links) + generated["links"]

    save_graph(merged_nodes, merged_links)

    return {
        "status": "merged",
        "filename": filename,
        "total_extracted": resume_data["total_extracted"],
        "domain": resume_data["domain"],
        "years_experience": resume_data["years_experience"],
        "projects": resume_data["projects"],
        "skills": resume_data["skills"],
        "new_nodes_count": len(generated["nodes"]),
        "new_links_count": len(generated["links"]),
        "graph": {"nodes": merged_nodes, "links": merged_links},
    }


@router.post("/analyze-text")
async def analyze_resume_text(payload: ResumeTextRequest):
    """Analyze pasted resume text and merge extracted skills into the knowledge graph."""
    if not payload.resume_text or len(payload.resume_text.strip()) < 25:
        raise HTTPException(
            status_code=400,
            detail="Please provide a comprehensive resume text snippet with skills and experience.",
        )

    filename = payload.filename or "pasted_resume.txt"

    try:
        resume_data = resume_service.extract_resume_data(payload.resume_text, filename=filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract skills: {e}")

    current_graph = get_graph()
    existing_nodes = current_graph.get("nodes", [])
    existing_links = current_graph.get("links", [])

    generated = resume_service.build_resume_graph_nodes(resume_data, existing_nodes)

    existing_ids = {n["id"] for n in existing_nodes}
    merged_nodes = list(existing_nodes)

    for n in generated["nodes"]:
        if n["id"] not in existing_ids:
            merged_nodes.append(n)
            existing_ids.add(n["id"])

    merged_links = list(existing_links) + generated["links"]

    save_graph(merged_nodes, merged_links)

    return {
        "status": "merged",
        "filename": filename,
        "total_extracted": resume_data["total_extracted"],
        "domain": resume_data["domain"],
        "years_experience": resume_data["years_experience"],
        "projects": resume_data["projects"],
        "skills": resume_data["skills"],
        "new_nodes_count": len(generated["nodes"]),
        "new_links_count": len(generated["links"]),
        "graph": {"nodes": merged_nodes, "links": merged_links},
    }

