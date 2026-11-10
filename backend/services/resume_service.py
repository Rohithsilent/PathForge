"""
Resume parsing and skill extraction service.

Supports:
1. In-memory PDF text extraction using pypdf.
2. Direct plaintext / markdown resume ingestion.
3. AI entity and skill extraction (languages, frameworks, databases, cloud, roles, projects).
4. Transformation into knowledge graph nodes tagged with source='resume'.
"""
import io
import re
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from services import ai_service
from services.tech_directory import TECH_DIRECTORY, match_technologies
from services.market_data import get_market_demand


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract plain text from uploaded PDF file bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text: List[str] = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                pages_text.append(page_text)
        extracted = "\n\n".join(pages_text).strip()
        if not extracted:
            raise ValueError("The PDF appears to be empty or contains only scanned images.")
        return extracted
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {e}")


def extract_resume_data(text: str, filename: str = "resume.pdf") -> Dict[str, Any]:
    """
    Extract structured skills, domains, projects, and work experience from resume text.
    Combines rule-based tech directory matching with AI extraction.
    """
    if not text or len(text.strip()) < 20:
        raise ValueError("Resume content is too short to extract skills from.")

    # 1. Rule-based technology matching against directory
    directory_matches = match_technologies(text)

    # 2. AI skill extraction
    ai_result = ai_service.extract_skills(
        source_type="resume",
        name=filename,
        languages=[],
        text=text,
        commits=0,
    )

    ai_skills = ai_result.get("skills", [])
    ai_concepts = ai_result.get("concepts", [])

    # Merge skills (deduplicate by lowercase name)
    skills_map: Dict[str, Dict[str, Any]] = {}
    for item in directory_matches:
        key = item["name"].lower()
        skills_map[key] = {
            "name": item["name"],
            "category": item.get("category", "concept"),
            "confidence": 0.85,
        }

    for item in ai_skills:
        key = item["name"].lower()
        if key not in skills_map:
            skills_map[key] = {
                "name": item["name"],
                "category": item.get("category", "concept"),
                "confidence": item.get("confidence", 0.8),
            }
        else:
            # Upgrade category if AI provided more specific categorization
            if item.get("category") and item["category"] != "concept":
                skills_map[key]["category"] = item["category"]

    for concept in ai_concepts:
        key = concept.lower()
        if key not in skills_map:
            skills_map[key] = {
                "name": concept,
                "category": "concept",
                "confidence": 0.75,
            }

    # Extract high-level summary info
    projects = _extract_projects_from_resume(text)
    years_exp = _estimate_experience_years(text)

    return {
        "filename": filename,
        "skills": list(skills_map.values()),
        "projects": projects,
        "years_experience": years_exp,
        "domain": ai_result.get("domain", "Software Engineering"),
        "total_extracted": len(skills_map),
    }


def build_resume_graph_nodes(
    resume_data: Dict[str, Any],
    existing_nodes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Convert extracted resume skills and projects into knowledge graph nodes.
    - Creates a 'source:resume' hub node.
    - Strengthens existing skills (setting source to 'both').
    - Adds new skills with source='resume'.
    - Links resume projects to technologies.
    """
    if existing_nodes is None:
        existing_nodes = []

    existing_by_id = {n["id"]: n for n in existing_nodes}
    existing_by_name = {n["name"].lower(): n for n in existing_nodes}

    nodes: List[Dict[str, Any]] = []
    links: List[Dict[str, Any]] = []
    seen_ids = set()

    filename = resume_data.get("filename", "Resume")
    source_node_id = "source:resume"

    # Hub node for the Resume source
    source_node = {
        "id": source_node_id,
        "name": f"Resume ({filename})",
        "category": "cert",
        "maturity": 90,
        "market_demand": 85,
        "val": 7.0,
        "source": "resume",
    }
    nodes.append(source_node)
    seen_ids.add(source_node_id)

    # Add extracted skills
    for skill in resume_data.get("skills", []):
        name = skill["name"]
        skill_id = name.lower().replace(" ", "-").replace(".", "").replace("/", "")
        category = skill.get("category", "concept")
        confidence = skill.get("confidence", 0.8)
        maturity = min(100, int(60 + confidence * 35))
        demand = get_market_demand(name)

        if skill_id in existing_by_id:
            node = existing_by_id[skill_id]
            node["maturity"] = max(node.get("maturity", 50), maturity)
            if node.get("source") != "resume":
                node["source"] = "both"
            target_id = skill_id
        elif name.lower() in existing_by_name:
            node = existing_by_name[name.lower()]
            node["maturity"] = max(node.get("maturity", 50), maturity)
            if node.get("source") != "resume":
                node["source"] = "both"
            target_id = node["id"]
        else:
            if skill_id not in seen_ids:
                nodes.append({
                    "id": skill_id,
                    "name": name,
                    "category": category,
                    "maturity": maturity,
                    "market_demand": demand,
                    "val": max(4.0, min(9.0, 4.0 + confidence * 5.0)),
                    "source": "resume",
                })
                seen_ids.add(skill_id)
            target_id = skill_id

        links.append({
            "source": source_node_id,
            "target": target_id,
            "type": "VALIDATES",
            "strength": round(confidence, 2),
        })

    # Add notable resume projects if detected
    for proj_name in resume_data.get("projects", [])[:4]:
        proj_id = f"project:{proj_name.lower().replace(' ', '-')}"
        if proj_id not in seen_ids and proj_id not in existing_by_id:
            nodes.append({
                "id": proj_id,
                "name": proj_name,
                "category": "repo",
                "maturity": 80,
                "market_demand": 75,
                "val": 6.0,
                "source": "resume",
            })
            seen_ids.add(proj_id)
            links.append({
                "source": source_node_id,
                "target": proj_id,
                "type": "HIGHLIGHTS",
                "strength": 0.8,
            })

    return {"nodes": nodes, "links": links}


def _extract_projects_from_resume(text: str) -> List[str]:
    """Scan resume text for project headings or bulleted project titles."""
    projects: List[str] = []
    lines = text.split("\n")
    in_projects_section = False
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        if re.search(r"^(key\s+)?projects?(\s+&?\s+experience)?:?$", cleaned, re.IGNORECASE):
            in_projects_section = True
            continue
        if in_projects_section:
            if re.search(r"^(education|skills|work\s+experience|certifications?):?$", cleaned, re.IGNORECASE):
                break
            # Match project title line (e.g., "• PathForge: AI Career Engine" or "SmartChat App | React, Node")
            match = re.match(r"^[•\-\*]?\s*([A-Za-z0-9\s\-]{3,35})(?:\s*[:|–—]|\s+\(|$)", cleaned)
            if match:
                title = match.group(1).strip()
                if len(title) > 3 and title.lower() not in ("project", "overview", "description", "details"):
                    projects.append(title)
                    if len(projects) >= 4:
                        break
    return projects


def _estimate_experience_years(text: str) -> float:
    """Heuristic estimate of years of experience from resume dates."""
    years = re.findall(r"\b(20[0-2][0-9])\b", text)
    if years:
        int_years = [int(y) for y in years]
        span = max(int_years) - min(int_years)
        return min(15.0, max(0.5, float(span)))
    return 1.0
