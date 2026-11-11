"""
User profile and connected accounts service.
Stores persistent user profiles in:
1. Local backend/data/users/{uid}.json & {uid}_graph.json
2. Firebase Auth custom user claims (for instant token verification)
3. Cloud Firestore (if Firestore API is enabled in Firebase Console)
"""
import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

USERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users")
os.makedirs(USERS_DIR, exist_ok=True)


def _get_user_file_path(uid: str) -> str:
    safe_uid = "".join(c for c in uid if c.isalnum() or c in ("-", "_"))
    return os.path.join(USERS_DIR, f"{safe_uid}.json")


def _get_user_graph_path(uid: str) -> str:
    safe_uid = "".join(c for c in uid if c.isalnum() or c in ("-", "_"))
    return os.path.join(USERS_DIR, f"{safe_uid}_graph.json")


def reconstruct_graph_from_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Rebuild a complete knowledge graph from stored repositories and skills."""
    from services.tech_directory import TECH_DIRECTORY, infer_tech_relationships
    from services.market_data import get_market_demand

    nodes: List[Dict[str, Any]] = []
    links: List[Dict[str, Any]] = []
    node_ids = set()

    # 1. Repositories and their associated skills
    repos = profile.get("github_repos", [])
    for repo in repos:
        name = repo.get("name")
        if not name:
            continue
        repo_id = f"repo:{name}"
        if repo_id not in node_ids:
            nodes.append({
                "id": repo_id,
                "name": name,
                "category": "repo",
                "source": "github",
                "repo": name,
                "repos": [name],
                "description": repo.get("description", ""),
                "stars": repo.get("stars", 0),
                "language": repo.get("languages", [""])[0] if repo.get("languages") else "",
                "maturity": min(100, (repo.get("commits", 1) or 1) * 2),
                "market_demand": 70,
                "val": 8,
            })
            node_ids.add(repo_id)

        for s in repo.get("skills", []):
            s_name = s.strip() if isinstance(s, str) else str(s).strip()
            if not s_name:
                continue
            skill_id = s_name.lower().replace(" ", "-").replace(".", "").replace("/", "").replace("+", "p").replace("#", "sharp")
            cat = TECH_DIRECTORY[s_name][0] if s_name in TECH_DIRECTORY else "concept"
            if skill_id not in node_ids:
                nodes.append({
                    "id": skill_id,
                    "name": s_name,
                    "category": cat,
                    "source": "github",
                    "repo": name,
                    "repos": [name],
                    "maturity": 50,
                    "market_demand": get_market_demand(s_name),
                    "val": 5,
                })
                node_ids.add(skill_id)
            else:
                for n in nodes:
                    if n["id"] == skill_id:
                        if "repos" in n and isinstance(n["repos"], list) and name not in n["repos"]:
                            n["repos"].append(name)
                        break

            links.append({
                "source": repo_id,
                "target": skill_id,
                "type": "USES",
                "strength": 0.8,
            })

    # 2. General profile skills
    for s in profile.get("skills", []):
        s_name = s.get("name", "") if isinstance(s, dict) else str(s).strip()
        s_cat = s.get("category", "concept") if isinstance(s, dict) else "concept"
        s_source = s.get("source", "profile") if isinstance(s, dict) else "profile"
        if not s_name:
            continue
        skill_id = s_name.lower().replace(" ", "-").replace(".", "").replace("/", "").replace("+", "p").replace("#", "sharp")
        if skill_id not in node_ids:
            nodes.append({
                "id": skill_id,
                "name": s_name,
                "category": s_cat,
                "source": s_source,
                "maturity": 50,
                "market_demand": get_market_demand(s_name),
                "val": 5,
            })
            node_ids.add(skill_id)

    # 3. LinkedIn skills
    for li_s in profile.get("linkedin_skills", []):
        s_name = li_s.get("name", "") if isinstance(li_s, dict) else str(li_s).strip()
        if not s_name:
            continue
        skill_id = s_name.lower().replace(" ", "-").replace(".", "").replace("/", "").replace("+", "p").replace("#", "sharp")
        if skill_id not in node_ids:
            nodes.append({
                "id": skill_id,
                "name": s_name,
                "category": "concept",
                "source": "linkedin",
                "maturity": 50,
                "market_demand": get_market_demand(s_name),
                "val": 5,
            })
            node_ids.add(skill_id)

    # 4. LeetCode stats graph nodes
    lc_stats = profile.get("leetcode_stats")
    if lc_stats and isinstance(lc_stats, dict) and "graph" in lc_stats:
        lc_graph = lc_stats.get("graph", {})
        for n in lc_graph.get("nodes", []):
            if n["id"] not in node_ids:
                nodes.append(n)
                node_ids.add(n["id"])
        for l in lc_graph.get("links", []):
            links.append(l)

    # 5. Infer tech relationships
    extra = infer_tech_relationships(nodes, links)
    if extra:
        links.extend(extra)

    return {"nodes": nodes, "links": links}


def get_user_graph(uid: str) -> Optional[Dict[str, Any]]:
    """Retrieve personal knowledge graph for a user."""
    if not uid:
        return None

    path = _get_user_graph_path(uid)
    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and (data.get("nodes") or data.get("links")):
                    return data
        except Exception as e:
            print(f"Error reading user graph for {uid}: {e}")

    # Fallback: check if stored inside profile or can be reconstructed
    profile = get_user_profile(uid)
    if profile:
        if profile.get("graph") and isinstance(profile["graph"], dict) and profile["graph"].get("nodes"):
            return profile["graph"]
        if profile.get("github_repos") or profile.get("skills"):
            reconstructed = reconstruct_graph_from_profile(profile)
            if reconstructed and reconstructed.get("nodes"):
                save_user_graph(uid, reconstructed)
                return reconstructed

    return None


def save_user_graph(uid: str, graph: Dict[str, Any]):
    """Save user-specific knowledge graph."""
    if not uid or not graph:
        return

    path = _get_user_graph_path(uid)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2)
    except Exception as e:
        print(f"Error saving user graph for {uid}: {e}")

    # Also sync to active graph service so global fallbacks match
    try:
        from services.graph_service import save_graph
        save_graph(graph.get("nodes", []), graph.get("links", []))
    except Exception as e:
        print(f"Error syncing user graph to active_graph: {e}")


def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from local store or Firebase Auth."""
    if not uid:
        return None

    path = _get_user_file_path(uid)
    profile: Optional[Dict[str, Any]] = None

    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                profile = json.load(f)
        except Exception as e:
            print(f"Error reading user profile for {uid}: {e}")

    # Fallback to Firebase custom claims
    if not profile:
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth
            if firebase_admin._apps:
                user_record = fb_auth.get_user(uid)
                claims = user_record.custom_claims or {}
                if claims:
                    profile = {
                        "uid": uid,
                        "email": user_record.email or "",
                        "name": user_record.display_name or "",
                        "avatar": user_record.photo_url or "",
                        "onboarding_completed": claims.get("onboarding_completed", False),
                        "github_username": claims.get("github_username", ""),
                        "github_connected": claims.get("github_connected", False),
                        "linkedin_connected": claims.get("linkedin_connected", False),
                        "linkedin_username": claims.get("linkedin_username", ""),
                        "leetcode_connected": claims.get("leetcode_connected", False),
                        "resume_connected": claims.get("resume_connected", False),
                        "target_role": claims.get("target_role", "Full Stack Developer"),
                    }
                    save_user_profile(uid, profile)
        except Exception as e:
            print(f"Firebase claims fallback check error: {e}")

    if profile:
        # Attach personal graph if available
        graph_path = _get_user_graph_path(uid)
        if os.path.isfile(graph_path):
            try:
                with open(graph_path, "r", encoding="utf-8") as f:
                    g = json.load(f)
                    if g and g.get("nodes"):
                        profile["graph"] = g
            except Exception:
                pass
        elif profile.get("github_repos") or profile.get("skills"):
            # Auto-reconstruct graph
            reconstructed = reconstruct_graph_from_profile(profile)
            if reconstructed and reconstructed.get("nodes"):
                save_user_graph(uid, reconstructed)
                profile["graph"] = reconstructed

    return profile


def save_user_profile(uid: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persist user profile to local storage, Firebase claims, and Firestore (if available)."""
    if not uid:
        return profile_data

    path = _get_user_file_path(uid)
    existing = get_user_profile(uid) or {}

    # Separate graph payload if present to avoid bloating main profile JSON
    graph_payload = profile_data.pop("graph", None)
    if graph_payload and isinstance(graph_payload, dict):
        save_user_graph(uid, graph_payload)

    merged = {**existing, **profile_data, "uid": uid, "updated_at": datetime.utcnow().isoformat()}
    if "created_at" not in merged:
        merged["created_at"] = datetime.utcnow().isoformat()

    # 1. Save locally
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(merged, f, indent=2)
    except Exception as e:
        print(f"Error saving local profile for {uid}: {e}")

    # 2. Update Firebase Auth custom claims
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            claims = {
                "onboarding_completed": bool(merged.get("onboarding_completed")),
                "github_username": merged.get("github_username", ""),
                "github_connected": bool(merged.get("github_connected")),
                "linkedin_connected": bool(merged.get("linkedin_connected")),
                "leetcode_connected": bool(merged.get("leetcode_connected")),
                "resume_connected": bool(merged.get("resume_connected")),
                "target_role": merged.get("target_role", "Full Stack Developer"),
            }
            fb_auth.set_custom_user_claims(uid, claims)
    except Exception as e:
        print(f"Could not update Firebase custom claims for {uid}: {e}")

    # 3. Best-effort Firestore sync (if Firestore API is enabled)
    try:
        import firebase_admin
        from firebase_admin import firestore
        if firebase_admin._apps:
            db = firestore.client()
            db.collection("users").document(uid).set(merged, merge=True)
    except Exception:
        # Ignore if Firestore is disabled in console
        pass

    return merged


def is_onboarding_completed(uid: str) -> bool:
    """Check if the user has completed onboarding and connected accounts."""
    profile = get_user_profile(uid)
    if not profile:
        return False
    return bool(
        profile.get("onboarding_completed") or
        profile.get("github_connected") or
        profile.get("linkedin_connected") or
        profile.get("leetcode_connected") or
        profile.get("resume_connected")
    )
