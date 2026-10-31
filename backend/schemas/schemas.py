from pydantic import BaseModel, Field
from typing import List, Optional


# --- Auth ---
class GitHubLoginRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class GitHubSyncRequest(BaseModel):
    token: str


class RepoAnalyzeRequest(BaseModel):
    url: str
    engine: Optional[str] = "orbitx"
    provider: Optional[str] = None  # "ollama" | "openrouter"


# --- Skill ---
class SkillNode(BaseModel):
    id: str
    name: str
    category: str
    maturity: float = 50.0
    market_demand: float = 70.0
    val: float = 5.0
    source: str = "github"


class GraphLink(BaseModel):
    source: str
    target: str
    type: str = "RELATED_TO"
    strength: float = 0.5


class GraphData(BaseModel):
    nodes: List[SkillNode]
    links: List[GraphLink]


# --- Certification ---
class CertificationInput(BaseModel):
    name: str
    issued_by: str = ""
    date: str = ""


# --- Career ---
class CareerReadinessResponse(BaseModel):
    career_readiness: float
    target_role: str
    skill_coverage: float
    avg_maturity: float
    market_alignment: float
    gaps: list


class WhatIfRequest(BaseModel):
    add_skills: List[str]
    engine: Optional[str] = "orbitx"
    provider: Optional[str] = None  # "ollama" | "openrouter"
    target_role: Optional[str] = "Full Stack Developer"


class WhatIfResponse(BaseModel):
    original_score: float
    new_score: float
    score_delta: float
    simulated_skills: List[str]
    reason: Optional[str] = None


# --- Roadmap ---
class RoadmapPhase(BaseModel):
    title: str
    duration: str
    skills: List[str]
    resources: List[str]


class RoadmapResponse(BaseModel):
    phases: List[RoadmapPhase]
    total_duration: str
    career_readiness_after: float


# --- Recruiter ---
class RecruiterProfile(BaseModel):
    name: str
    username: str
    target_role: str
    career_readiness: float
    skill_maturity_avg: float
    project_depth: float
    market_alignment: float
    risk_areas: List[str]
    top_skills: List[dict]
    skill_distribution: dict


# --- Notion ---
class NotionPageSummary(BaseModel):
    id: str
    title: str
    skills_extracted: List[str] = []
