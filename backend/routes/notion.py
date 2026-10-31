from fastapi import APIRouter

from config import settings
from services import notion_service, ai_service
from seed_data import DEMO_NOTION_PAGES

router = APIRouter(tags=["notion"])


@router.get("/pages")
async def get_notion_pages():
    """Fetch Notion pages and extract skills from their content."""
    if settings.demo_mode or not settings.notion_token:
        return {"pages": DEMO_NOTION_PAGES, "source": "demo"}

    pages = await notion_service.fetch_notion_pages(settings.notion_token)
    result = []
    for page in pages[:10]:
        page_id = page.get("id", "")
        title = notion_service.extract_page_title(page)
        content = await notion_service.fetch_page_content(
            settings.notion_token, page_id
        )

        extraction = ai_service.extract_skills(
            source_type="notion",
            name=title,
            languages=[],
            text=content,
        )

        result.append({
            "id": page_id,
            "title": title,
            "skills_extracted": [s["name"] for s in extraction.get("skills", [])],
        })

    return {"pages": result, "source": "notion"}
