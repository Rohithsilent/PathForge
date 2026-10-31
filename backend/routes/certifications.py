from fastapi import APIRouter
from typing import List

from schemas.schemas import CertificationInput
from services.certification_service import extract_skills_from_cert, build_cert_nodes
from seed_data import DEMO_CERTIFICATIONS

router = APIRouter(tags=["certifications"])

# In-memory store for certifications (per-session)
_user_certs: List[dict] = list(DEMO_CERTIFICATIONS)


@router.get("/")
async def get_certifications():
    """List all user certifications."""
    return {"certifications": _user_certs}


@router.post("/")
async def add_certification(cert: CertificationInput):
    """Add a new certification and extract associated skills."""
    cert_dict = cert.dict()
    skills = extract_skills_from_cert(cert.name)
    cert_dict["skills"] = skills
    _user_certs.append(cert_dict)

    nodes = build_cert_nodes([cert_dict])
    return {
        "certification": cert_dict,
        "skills_extracted": skills,
        "graph_nodes": nodes,
    }


@router.delete("/{cert_name}")
async def remove_certification(cert_name: str):
    """Remove a certification by name."""
    global _user_certs
    _user_certs = [c for c in _user_certs if c["name"] != cert_name]
    return {"removed": cert_name}
