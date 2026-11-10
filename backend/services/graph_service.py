from typing import Dict, List
import os
import json

from config import settings
from services.tech_directory import infer_tech_relationships


# In-memory fallback for demo mode (when Neo4j is not configured)
_graph_store: Dict = {"nodes": [], "links": []}
GRAPH_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "active_graph.json")


def _persist_local_graph():
    try:
        os.makedirs(os.path.dirname(GRAPH_FILE), exist_ok=True)
        with open(GRAPH_FILE, "w", encoding="utf-8") as f:
            json.dump(_graph_store, f)
    except Exception as e:
        print(f"Error persisting graph to {GRAPH_FILE}: {e}")


def _load_local_graph():
    global _graph_store
    if os.path.isfile(GRAPH_FILE):
        try:
            with open(GRAPH_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _graph_store = {
                    "nodes": data.get("nodes", []),
                    "links": data.get("links", []),
                }
        except Exception as e:
            print(f"Error loading graph from {GRAPH_FILE}: {e}")


# Pre-load on import if file exists
_load_local_graph()


def get_driver():
    """Get Neo4j driver, or None if not configured."""
    if not settings.neo4j_uri:
        return None
    try:
        from neo4j import GraphDatabase
        return GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )
    except Exception:
        return None


def save_graph(nodes: List[Dict], links: List[Dict]):
    """Save graph data to Neo4j or in-memory store and file."""
    # Ensure natural inter-technology relationships are linked
    extra_links = infer_tech_relationships(nodes, links)
    if extra_links:
        links = list(links) + extra_links

    driver = get_driver()
    if driver is None:
        _graph_store["nodes"] = nodes
        _graph_store["links"] = links
        _persist_local_graph()
        return

    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")

        for node in nodes:
            label = node.get("category", "Skill").capitalize()
            session.run(
                f"""
                MERGE (s:{label} {{id: $id}})
                SET s.name = $name,
                    s.category = $category,
                    s.maturity = $maturity,
                    s.market_demand = $market_demand,
                    s.source = $source,
                    s.val = $val
                """,
                id=node["id"],
                name=node["name"],
                category=node.get("category", "concept"),
                maturity=node.get("maturity", 50),
                market_demand=node.get("market_demand", 70),
                source=node.get("source", "github"),
                val=node.get("val", 5.0),
            )

        for link in links:
            rel_type = link.get("type", "RELATED_TO")
            session.run(
                f"""
                MATCH (a {{id: $source}}), (b {{id: $target}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r.strength = $strength
                """,
                source=link["source"],
                target=link["target"],
                strength=link.get("strength", 0.5),
            )

    driver.close()


def get_graph() -> Dict:
    """Retrieve full graph data from Neo4j or in-memory store."""
    driver = get_driver()
    if driver is None:
        _load_local_graph()
        return _graph_store

    with driver.session() as session:
        nodes_result = session.run(
            "MATCH (n) RETURN n.id as id, n.name as name, n.category as category, "
            "n.maturity as maturity, n.market_demand as market_demand, "
            "n.source as source, n.val as val"
        )
        links_result = session.run(
            "MATCH (a)-[r]->(b) "
            "RETURN a.id as source, b.id as target, "
            "type(r) as type, r.strength as strength"
        )

        nodes = [dict(record) for record in nodes_result]
        links = [dict(record) for record in links_result]

    driver.close()
    return {"nodes": nodes, "links": links}


def add_node(node: Dict):
    """Add a single node to the graph."""
    driver = get_driver()
    if driver is None:
        _graph_store["nodes"].append(node)
        _persist_local_graph()
        return

    with driver.session() as session:
        session.run(
            """
            MERGE (s:Skill {id: $id})
            SET s.name = $name,
                s.category = $category,
                s.maturity = $maturity,
                s.market_demand = $market_demand,
                s.source = $source
            """,
            **node,
        )
    driver.close()


def add_link(link: Dict):
    """Add a single relationship to the graph."""
    driver = get_driver()
    if driver is None:
        _graph_store["links"].append(link)
        _persist_local_graph()
        return

    rel_type = link.get("type", "RELATED_TO")
    with driver.session() as session:
        session.run(
            f"""
            MATCH (a {{id: $source}}), (b {{id: $target}})
            MERGE (a)-[r:{rel_type}]->(b)
            SET r.strength = $strength
            """,
            source=link["source"],
            target=link["target"],
            strength=link.get("strength", 0.5),
        )
    driver.close()


def add_nodes_and_links(nodes: List[Dict], links: List[Dict]):
    """Add multiple nodes and links to the graph (merging)."""
    driver = get_driver()
    if driver is None:
        # In-memory merge
        existing_ids = {n["id"] for n in _graph_store["nodes"]}
        for node in nodes:
            if node["id"] not in existing_ids:
                _graph_store["nodes"].append(node)
                existing_ids.add(node["id"])
        _graph_store["links"].extend(links)
        _persist_local_graph()
        return

    with driver.session() as session:
        for node in nodes:
            label = node.get("category", "Skill").capitalize()
            session.run(
                f"""
                MERGE (s:{label} {{id: $id}})
                SET s.name = $name,
                    s.category = $category,
                    s.maturity = $maturity,
                    s.market_demand = $market_demand,
                    s.source = $source,
                    s.val = $val
                """,
                id=node["id"],
                name=node["name"],
                category=node.get("category", "concept"),
                maturity=node.get("maturity", 50),
                market_demand=node.get("market_demand", 70),
                source=node.get("source", "github"),
                val=node.get("val", 5.0),
            )

        for link in links:
            rel_type = link.get("type", "RELATED_TO")
            session.run(
                f"""
                MATCH (a {{id: $source}}), (b {{id: $target}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r.strength = $strength
                """,
                source=link["source"],
                target=link["target"],
                strength=link.get("strength", 0.5),
            )
    driver.close()
