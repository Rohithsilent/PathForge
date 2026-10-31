from typing import List, Dict


# Certifications are added manually by the user via the dashboard.
# Stored in Neo4j and linked to skills they validate.

KNOWN_CERT_SKILLS: Dict[str, List[str]] = {
    "AWS Certified Developer":         ["AWS", "Cloud", "Python", "DevOps"],
    "AWS Certified Solutions Architect": ["AWS", "Cloud", "Architecture", "DevOps"],
    "Google Professional ML Engineer": ["Python", "TensorFlow", "ML", "GCP"],
    "Meta Frontend Developer":         ["React", "JavaScript", "CSS", "HTML"],
    "MongoDB Associate Developer":     ["MongoDB", "NoSQL", "Node.js"],
    "GitHub Actions Certification":    ["CI/CD", "DevOps", "GitHub"],
    "Microsoft Azure Fundamentals":    ["Azure", "Cloud", "DevOps"],
    "Kubernetes Administrator":        ["Kubernetes", "Docker", "DevOps"],
    "TensorFlow Developer Certificate": ["TensorFlow", "Python", "ML", "Deep Learning"],
}


def extract_skills_from_cert(cert_name: str) -> List[str]:
    """Map a certification name to its associated skills."""
    for known_cert, skills in KNOWN_CERT_SKILLS.items():
        if known_cert.lower() in cert_name.lower():
            return skills
    # Generic fallback — return cert name as a skill
    return [cert_name]


def build_cert_nodes(certifications: List[Dict]) -> List[Dict]:
    """Build graph nodes from a list of certifications."""
    nodes = []
    for cert in certifications:
        nodes.append({
            "id": cert["name"].lower().replace(" ", "-"),
            "name": cert["name"],
            "category": "cert",
            "maturity": 100,        # certs are binary — you have it or you don't
            "market_demand": 85,
            "val": 10.0,
            "issued_by": cert.get("issued_by", ""),
            "date": cert.get("date", ""),
            "source": "cert",
        })
    return nodes
