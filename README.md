# PathForge — Interactive 3D Knowledge Graph Builder

> AI-powered Career Intelligence Platform that transforms GitHub activity, Notion notes, and certifications into measurable hiring intelligence using AI reasoning and interactive 3D knowledge graphs.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Cost](https://img.shields.io/badge/Cost-$0-green.svg)
![Status](https://img.shields.io/badge/Status-Demo_Ready-brightgreen.svg)

---

## ✨ Features

- **🔮 Interactive 3D Knowledge Graph** — Force-directed, zoomable, clickable skill visualization
- **🔗 GitHub Integration** — OAuth login, live repo fetching, language extraction
- **🤖 AI Skill Extraction** — Open-weight LLM skill extraction (free) via OpenRouter or local Ollama
- **📊 Career Readiness Score** — Quantified 0-100 with breakdown
- **🎯 Skill Gap Analysis** — AI-powered gap identification with priority scores
- **🔮 What-If Simulator** — "If you learn PyTorch, readiness +16%"
- **👔 Recruiter Mode** — Radar chart + PDF export
- **📈 Analytics Dashboard** — Pie, radar, area, and bar charts
- **🔍 Search & Filter** — Real-time node search + category filter
- **🌊 Market Demand Overlay** — Node glow intensity by demand

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| 3D Engine | 3d-force-graph + Three.js |
| State | Zustand |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| AI | Open-weight models (Gemma 4 26B A4B via OpenRouter, or local Qwen2.5 via Ollama) |
| Graph DB | Neo4j AuraDB (free) |
| Auth | GitHub OAuth + JWT |

**Total cost: $0**

---

## 🚀 Quick Start

**Backend**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy ..\.env.example .env            # macOS/Linux: cp ../.env.example .env
# Add OPENROUTER_API_KEY, or set AI_PROVIDER=ollama for local inference
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. `GET /ai/status` reports the active provider/model (never keys).

> Analyzing repos uses GitHub's public API, which allows 60 requests/hour without a token. Add `GITHUB_TOKEN=` to `backend/.env` (a public-repo token raises it to 5,000/hour) before running several analyses or demo takes.

> The backend loads `.env` relative to its working directory — use `backend/.env`, not the root `.env.example`. See [RUNBOOK.md](RUNBOOK.md) for a 3-minute demo script and screenshots list.

---

## 🧠 Open-source AI

All AI features — skill extraction, gap analysis, roadmaps, what-if simulation and the Copilot — run on **open-weight models**. No closed AI API is required.

Choose where inference runs with `AI_PROVIDER` in `backend/.env`:

| Provider | Config | Notes |
|----------|--------|-------|
| OpenRouter (default) | `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Hosted open-weight model. Free tier: 20 req/min, 50 req/day (1,000/day after a one-time $10 credit purchase). |
| Ollama (local) | `AI_PROVIDER=ollama`, `OLLAMA_MODEL` | Inference stays on your machine — no data leaves the laptop. |
| Ollama Cloud | `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_API_KEY` | Fast on any hardware; `gemma4:cloud` is on the free plan. |

Swap models without code changes:

```bash
# Hosted open-weight (Apache-2.0, fastest option)
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
# or the larger, higher-quality option
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free

# Local
ollama pull qwen2.5:7b-instruct
OLLAMA_MODEL=qwen2.5:7b-instruct
```

`OPENROUTER_FALLBACK_MODELS` (comma-separated) is tried automatically when the primary free model is rate-limited upstream or returns a reasoning-only response with no text.

Responses are cached for 24 hours and gap explanations are batched into a single call, keeping free-tier usage low. Every AI call falls back to deterministic local heuristics if the provider is unavailable, so the demo still works offline.

**Model licensing:** Gemma 4 26B A4B and Qwen2.5-7B-Instruct are Apache-2.0 (OSI-approved open source, verified on Hugging Face). NVIDIA Nemotron is released under its own open-model license — check each model card ([Gemma](https://huggingface.co/google/gemma-4-26B-A4B-it), [Qwen](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct), [Nemotron on OpenRouter](https://openrouter.ai/nvidia/nemotron-3-super-120b-a12b:free)) before redistributing weights.

---

## 📁 Project Structure

```
3dgraph-builders/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Pydantic settings
│   ├── seed_data.py          # Demo dataset (Aryan Sharma)
│   ├── routes/               # API endpoints
│   │   ├── auth.py
│   │   ├── github.py
│   │   ├── notion.py
│   │   ├── certifications.py
│   │   ├── graph.py
│   │   ├── career.py
│   │   └── recruiter.py
│   ├── services/             # Business logic
│   │   ├── github_service.py
│   │   ├── notion_service.py
│   │   ├── certification_service.py
│   │   ├── ai_service.py
│   │   ├── scoring_service.py
│   │   ├── graph_service.py
│   │   └── cache_service.py
│   └── schemas/              # Pydantic models
│       └── schemas.py
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── page.tsx      # Landing page
│   │   │   └── dashboard/
│   │   │       ├── page.tsx  # Main dashboard
│   │   │       └── analytics/
│   │   │           └── page.tsx
│   │   ├── components/       # React components
│   │   │   ├── graph/        # 3D graph
│   │   │   ├── panels/       # Side panels
│   │   │   ├── ui/           # UI primitives
│   │   │   └── layout/       # Layout shells
│   │   ├── stores/           # Zustand stores
│   │   └── lib/              # API + mock data
│   └── package.json
├── .env.example
└── README.md
```

---

## 🎯 PS9 Requirements Coverage

| Requirement | Status |
|------------|--------|
| GitHub data extraction | ✅ |
| Notion integration | ✅ |
| Certifications | ✅ |
| NLP-based skill extraction | ✅ |
| Graph database (Neo4j) | ✅ |
| Auto-generate knowledge graph | ✅ |
| Interactive 3D visualization | ✅ |
| Search & filter | ✅ |
| Skill gap analysis | ✅ |
| Career roadmap | ✅ |
| What-If simulator | ✅ |
| Recruiter mode | ✅ |
| Market demand overlay | ✅ |
| Analytics dashboard | ✅ |
| Secure authentication | ✅ |

---

## 📄 License

MIT
