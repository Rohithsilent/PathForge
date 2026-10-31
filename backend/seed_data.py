# Carefully designed demo story — not random data.
# Aryan is strong in frontend, weak in ML — gap is visually obvious in the graph.
# Adding PyTorch in What-If jumps readiness 58% → 74%.

DEMO_USER = {
    "name": "Aryan Sharma",
    "username": "aryan-dev",
    "target_role": "ML Engineer",
    "career_readiness": 58.0,
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=aryan",
}

DEMO_REPOS = [
    {
        "name": "orbit-dashboard",
        "languages": ["TypeScript", "JavaScript", "CSS"],
        "commits": 68,
        "stars": 24,
        "description": "Full-stack career dashboard built with React, Next.js and Tailwind",
    },
    {
        "name": "studyhub-api",
        "languages": ["JavaScript", "Node.js", "MongoDB"],
        "commits": 41,
        "stars": 14,
        "description": "REST API for a student study-group app with Express, JWT and MongoDB",
    },
    {
        "name": "digit-lab",
        "languages": ["Python", "Jupyter Notebook"],
        "commits": 19,
        "stars": 7,
        "description": "Image-classification experiments with NumPy and Jupyter notebooks",
    },
    {
        "name": "fastapi-notes",
        "languages": ["Python"],
        "commits": 26,
        "stars": 11,
        "description": "Notes API with FastAPI, SQLAlchemy and JWT authentication",
    },
]

DEMO_NOTION_PAGES = [
    {
        "title": "ML Learning Roadmap",
        "text": "Studying neural networks, backpropagation, PyTorch basics",
    },
    {
        "title": "System Design Notes",
        "text": "Load balancing, caching, database sharding, microservices",
    },
]

DEMO_CERTIFICATIONS = [
    {"name": "Meta Frontend Developer", "issued_by": "Coursera", "date": "2024-03"},
]

DEMO_NODES = [
    {"id": "react",      "name": "React",         "category": "frontend", "maturity": 87, "market_demand": 92, "val": 8.7, "source": "github"},
    {"id": "javascript", "name": "JavaScript",    "category": "frontend", "maturity": 82, "market_demand": 88, "val": 8.2, "source": "github"},
    {"id": "css",        "name": "CSS",            "category": "frontend", "maturity": 74, "market_demand": 70, "val": 7.4, "source": "github"},
    {"id": "html",       "name": "HTML",           "category": "frontend", "maturity": 70, "market_demand": 65, "val": 7.0, "source": "github"},
    {"id": "nodejs",     "name": "Node.js",        "category": "backend",  "maturity": 61, "market_demand": 80, "val": 6.1, "source": "github"},
    {"id": "express",    "name": "Express",        "category": "backend",  "maturity": 58, "market_demand": 72, "val": 5.8, "source": "github"},
    {"id": "python",     "name": "Python",         "category": "backend",  "maturity": 61, "market_demand": 95, "val": 6.1, "source": "github"},
    {"id": "fastapi",    "name": "FastAPI",        "category": "backend",  "maturity": 54, "market_demand": 78, "val": 5.4, "source": "github"},
    {"id": "mongodb",    "name": "MongoDB",        "category": "database", "maturity": 45, "market_demand": 74, "val": 4.5, "source": "github"},
    {"id": "numpy",      "name": "NumPy",          "category": "ml",       "maturity": 34, "market_demand": 85, "val": 3.4, "source": "github"},
    {"id": "jupyter",    "name": "Jupyter",        "category": "ml",       "maturity": 30, "market_demand": 72, "val": 3.0, "source": "github"},
    {"id": "typescript", "name": "TypeScript",     "category": "frontend", "maturity": 64, "market_demand": 90, "val": 6.4, "source": "github"},
    {"id": "nextjs",     "name": "Next.js",        "category": "frontend", "maturity": 60, "market_demand": 86, "val": 6.0, "source": "github"},
    {"id": "git",        "name": "Git",            "category": "devops",   "maturity": 78, "market_demand": 90, "val": 7.8, "source": "github"},
    {"id": "ml-roadmap", "name": "ML Roadmap",     "category": "concept",  "maturity": 40, "market_demand": 60, "val": 4.0, "source": "notion"},
    {"id": "sys-design", "name": "System Design",  "category": "concept",  "maturity": 35, "market_demand": 88, "val": 3.5, "source": "notion"},
    {"id": "meta-cert",  "name": "Meta Frontend",  "category": "cert",     "maturity": 100, "market_demand": 85, "val": 10.0, "source": "cert"},
    {"id": "repo:orbit-dashboard", "name": "orbit-dashboard", "category": "repo", "maturity": 74, "market_demand": 78, "val": 7.4, "source": "github"},
    {"id": "repo:studyhub-api", "name": "studyhub-api", "category": "repo", "maturity": 62, "market_demand": 70, "val": 6.2, "source": "github"},
    {"id": "repo:digit-lab", "name": "digit-lab", "category": "repo", "maturity": 38, "market_demand": 64, "val": 5.0, "source": "github"},
    {"id": "repo:fastapi-notes", "name": "fastapi-notes", "category": "repo", "maturity": 56, "market_demand": 70, "val": 5.6, "source": "github"},
]

DEMO_LINKS = [
    {"source": "react",      "target": "javascript", "type": "RELATED_TO", "strength": 0.95},
    {"source": "react",      "target": "css",        "type": "RELATED_TO", "strength": 0.80},
    {"source": "react",      "target": "html",       "type": "RELATED_TO", "strength": 0.75},
    {"source": "javascript", "target": "nodejs",     "type": "RELATED_TO", "strength": 0.80},
    {"source": "nodejs",     "target": "express",    "type": "RELATED_TO", "strength": 0.90},
    {"source": "express",    "target": "mongodb",    "type": "RELATED_TO", "strength": 0.70},
    {"source": "python",     "target": "numpy",      "type": "RELATED_TO", "strength": 0.85},
    {"source": "python",     "target": "fastapi",    "type": "RELATED_TO", "strength": 0.75},
    {"source": "python",     "target": "jupyter",    "type": "RELATED_TO", "strength": 0.70},
    {"source": "numpy",      "target": "jupyter",    "type": "RELATED_TO", "strength": 0.65},
    {"source": "ml-roadmap", "target": "numpy",      "type": "MENTIONS",   "strength": 0.60},
    {"source": "ml-roadmap", "target": "python",     "type": "MENTIONS",   "strength": 0.55},
    {"source": "sys-design", "target": "nodejs",     "type": "MENTIONS",   "strength": 0.50},
    {"source": "sys-design", "target": "mongodb",    "type": "MENTIONS",   "strength": 0.45},
    {"source": "meta-cert",  "target": "react",      "type": "VALIDATES",  "strength": 0.90},
    {"source": "meta-cert",  "target": "javascript", "type": "VALIDATES",  "strength": 0.85},
    {"source": "meta-cert",  "target": "css",        "type": "VALIDATES",  "strength": 0.80},
    {"source": "git",        "target": "nodejs",     "type": "RELATED_TO", "strength": 0.40},
    {"source": "git",        "target": "python",     "type": "RELATED_TO", "strength": 0.40},
    {"source": "nextjs",     "target": "react",      "type": "RELATED_TO", "strength": 0.90},
    {"source": "nextjs",     "target": "typescript", "type": "RELATED_TO", "strength": 0.80},
    {"source": "typescript", "target": "javascript", "type": "RELATED_TO", "strength": 0.90},
    {"source": "repo:orbit-dashboard", "target": "javascript", "type": "WRITTEN_IN", "strength": 0.95},
    {"source": "repo:orbit-dashboard", "target": "typescript", "type": "WRITTEN_IN", "strength": 0.95},
    {"source": "repo:orbit-dashboard", "target": "react",      "type": "WRITTEN_IN", "strength": 0.90},
    {"source": "repo:orbit-dashboard", "target": "nextjs",     "type": "WRITTEN_IN", "strength": 0.90},
    {"source": "repo:orbit-dashboard", "target": "css",        "type": "WRITTEN_IN", "strength": 0.85},
    {"source": "repo:studyhub-api", "target": "javascript", "type": "WRITTEN_IN", "strength": 0.95},
    {"source": "repo:studyhub-api", "target": "nodejs",     "type": "WRITTEN_IN", "strength": 0.90},
    {"source": "repo:studyhub-api", "target": "express",    "type": "WRITTEN_IN", "strength": 0.85},
    {"source": "repo:studyhub-api", "target": "mongodb",    "type": "WRITTEN_IN", "strength": 0.80},
    {"source": "repo:digit-lab", "target": "python",  "type": "WRITTEN_IN", "strength": 0.95},
    {"source": "repo:digit-lab", "target": "jupyter", "type": "WRITTEN_IN", "strength": 0.90},
    {"source": "repo:digit-lab", "target": "numpy",   "type": "WRITTEN_IN", "strength": 0.80},
    {"source": "repo:fastapi-notes", "target": "python",  "type": "WRITTEN_IN", "strength": 0.95},
    {"source": "repo:fastapi-notes", "target": "fastapi", "type": "WRITTEN_IN", "strength": 0.90},
]

DEMO_GAPS = [
    {"skill": "PyTorch",       "priority": 0.94, "reason": "Core framework for ML Engineer role — essential for deep learning models"},
    {"skill": "scikit-learn",  "priority": 0.88, "reason": "Essential for classical ML workflows — regression, classification, clustering"},
    {"skill": "Docker",        "priority": 0.72, "reason": "Required for production ML deployment and containerized workflows"},
    {"skill": "TensorFlow",    "priority": 0.68, "reason": "Widely used in industry for production ML systems"},
    {"skill": "SQL",           "priority": 0.55, "reason": "Data querying is fundamental for any data-heavy ML role"},
]

# Career role definitions for gap analysis
CAREER_ROLES = {
    "ML Engineer": {
        "required": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "Docker", "SQL", "NumPy", "Git"],
        "nice_to_have": ["Kubernetes", "AWS", "MLOps", "Spark", "Pandas"],
    },
    "Frontend Developer": {
        "required": ["JavaScript", "React", "CSS", "HTML", "TypeScript", "Git"],
        "nice_to_have": ["Next.js", "Vue", "Tailwind", "Testing"],
    },
    "Backend Developer": {
        "required": ["Python", "Node.js", "SQL", "Docker", "Git", "REST API"],
        "nice_to_have": ["Kubernetes", "Redis", "GraphQL", "Microservices"],
    },
    "Full Stack Developer": {
        "required": ["JavaScript", "React", "Node.js", "Python", "SQL", "Git", "CSS"],
        "nice_to_have": ["TypeScript", "Docker", "AWS", "MongoDB"],
    },
    "Data Scientist": {
        "required": ["Python", "NumPy", "Pandas", "scikit-learn", "SQL", "Statistics"],
        "nice_to_have": ["TensorFlow", "PyTorch", "Tableau", "Spark"],
    },
}

WHATIF_PYTORCH_DELTA = 16.0
