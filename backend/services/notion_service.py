import httpx
from typing import List, Dict


NOTION_API = "https://api.notion.com/v1"


async def fetch_notion_pages(notion_token: str) -> List[Dict]:
    """Search for all pages accessible to the integration."""
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Notion-Version": "2022-06-01",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{NOTION_API}/search",
            headers=headers,
            json={
                "filter": {"value": "page", "property": "object"},
                "page_size": 20,
            }
        )
        return res.json().get("results", [])


async def fetch_page_content(notion_token: str, page_id: str) -> str:
    """Fetch text content from a Notion page's blocks (truncated to 2000 chars)."""
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Notion-Version": "2022-06-01"
    }
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{NOTION_API}/blocks/{page_id}/children",
            headers=headers
        )
        blocks = res.json().get("results", [])
        text_parts = []
        for block in blocks:
            block_type = block.get("type", "")
            if block_type in [
                "paragraph", "heading_1", "heading_2", "heading_3",
                "bulleted_list_item"
            ]:
                rich_text = block.get(block_type, {}).get("rich_text", [])
                for rt in rich_text:
                    text_parts.append(rt.get("plain_text", ""))
        return " ".join(text_parts)[:2000]


def extract_page_title(page: Dict) -> str:
    """Extract the title from a Notion page object."""
    props = page.get("properties", {})
    for key in ["title", "Name", "Title"]:
        if key in props:
            title_arr = props[key].get("title", [])
            if title_arr:
                return title_arr[0].get("plain_text", "Untitled")
    return "Untitled"
