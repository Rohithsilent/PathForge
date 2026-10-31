# Demo runbook — PathForge

A 5-minute setup and a 3-minute demo script for recording the DevRelay session.

## 1. Start the app

Two terminals from the repo root.

```bash
# Terminal 1 — backend (loads backend/.env)
cd backend
# Linux / macOS:
source .venv/bin/activate
uvicorn main:app --reload --port 8000
# Windows:
# .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open http://localhost:3000.

Check the active model (never prints keys):

```bash
curl http://localhost:8000/ai/status
```

`configured: false` means no provider is set up, so AI features use deterministic
heuristics and the demo still works.

## 2. Model option A — local inference (private, $0)

```bash
ollama pull qwen2.5:7b-instruct
```

In `backend/.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b-instruct
```

Restart the backend. `/ai/status` should show `"local": true`.

**Warm the model before recording** — the first call after a restart loads 4.7 GB
into memory and takes ~40-75 s; after that, repo analysis is ~20 s, gap
explanations ~12 s and a roadmap ~16 s on a GTX 1660.

```bash
ollama run qwen2.5:7b-instruct "Reply with OK"
```

## 3. Model option B — hosted open-weight

Create a key at https://openrouter.ai/keys and put it in `backend/.env`
(directly in the file, never in chat or a screenshot):

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
```

Restart the backend. `/ai/status` should show `"configured": true`.

Before analyzing several repos (or doing multiple demo takes), add a GitHub token
to `backend/.env` — anonymous GitHub API calls are limited to **60 per hour**,
which is easy to exhaust:

```env
GITHUB_TOKEN=ghp_...
```

A classic PAT with no scopes, or a fine-grained token with "Public repositories:
Read", raises the limit to 5,000/hour. Without it, an analysis can fail with a
rate-limit message that names the reset time.

## 4. Record the demo (2-3 minutes)

1. **Landing page** — paste `github.com/tiangolo/fastapi`, press Analyze.
2. **Graph** — rotate the 3D skill graph; point out repo → skill links.
3. **Career readiness** — score, breakdown, prioritized gaps.
4. **Roadmap** — generated phases and resources.
5. **Copilot** — ask "What should I learn next?"; switch PathForge → Open-Weight → Brutal to show the same open-weight model with different personas.
6. **Engine menu footer** — shows the model name and whether it is local Ollama or OpenRouter.
7. Close on the privacy point: with local Ollama, the repo text and career data never leave the machine.

## 5. First-user test (10 minutes)

Pick one person who matches the target user (junior developer or career-switcher).

1. Ask them to open http://localhost:3000 and analyze **their own public repo**.
2. Have them pick a target role and read the readiness score, gaps, and roadmap.
3. Ask: *Was the extracted skill list accurate? Did the gaps feel true? Would you
   share this with a recruiter? Would you pay $5 for a PDF report? What's missing?*
4. Write down their exact words — the submission wants a quote, not a paraphrase.

Do not explain the app first. Watch where they hesitate; that is the real feedback.

## 6. Screenshots to capture

- Landing page with the repo input
- 3D graph after analysis
- Readiness score + gap list
- Roadmap
- Copilot answer with the engine footer visible

Put them in `docs/screenshots/` and link them from `SUBMISSION.md`.
