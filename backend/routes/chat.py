from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from services.chat_service import chat

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    engine: Optional[str] = "orbitx"
    provider: Optional[str] = None  # "ollama" | "openrouter"


class ChatResponse(BaseModel):
    response: str


@router.post("/message", response_model=ChatResponse)
async def send_message(req: ChatRequest):
    """Send a message to the AI copilot and get a context-aware response."""
    history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    response_text = chat(
        req.message,
        history_dicts,
        engine=req.engine or "orbitx",
        provider=req.provider,
    )
    return ChatResponse(response=response_text)

