from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from services import llm_service
from routes import auth, github, notion, certifications, graph, career, recruiter, chat, profile

app = FastAPI(
    title="PathForge API",
    description="AI-powered career intelligence platform",
    version="1.0.0",
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router,           prefix="/auth")
app.include_router(github.router,         prefix="/github")
app.include_router(notion.router,         prefix="/notion")
app.include_router(certifications.router, prefix="/certifications")
app.include_router(graph.router,          prefix="/graph")
app.include_router(career.router,         prefix="/career")
app.include_router(recruiter.router,      prefix="/recruiter")
app.include_router(chat.router,           prefix="/chat")
app.include_router(profile.router,        prefix="/profile")


@app.get("/")
def root():
    return {"status": "ok", "message": "PathForge API running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/ai/status")
def ai_status():
    """Expose which open-weight provider/model is active. Never returns keys."""
    return {
        **llm_service.status(),
        "configured": llm_service.is_available(),
        "demo_mode": settings.demo_mode,
    }
