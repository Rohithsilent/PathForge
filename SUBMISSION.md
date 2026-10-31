# PathForge — Hacktoberfest Open-Source AI Challenge, Week 2 submission

> Draft for the DEV post. Replace every `[PLACEHOLDER]`, then delete this note and
> the "Before publishing" checklist at the bottom. Sections marked optional can be
> removed if unused — but the first-user section is where the bonus points are.

**A verified skill graph for developers who are tired of self-reporting on résumés.**

## What I Built

Most junior developers and career-switchers have the same problem: their résumé
says "React, Python, Docker" but nothing proves it. Recruiters have the mirror
problem — every applicant claims the same skills.

**PathForge** turns a public GitHub repository into a verified skill
graph, a 0–100 career-readiness score, a prioritized skill-gap analysis, and a
learning roadmap. Paste a repo URL, and the app reads what you actually built,
extracts the technologies it can see evidence for, and shows how those skills
line up with a target role.

**Who would pay:** [PLACEHOLDER — pick one narrow user, e.g. "career-switchers
applying to backend roles who have projects but no CS degree"].

**What they'd pay for:** a shareable, recruiter-ready **Verified Skill Report**
generated from the graph — the proof layer their résumé lacks.
Pricing hypothesis: [PLACEHOLDER — e.g. $5 per report, or $19/month for a
recruiter seat]. This is a hypothesis to test with the first user, not revenue
yet.

## Demo

- **Video demo:** [PLACEHOLDER — 2–3 minute Loom/YouTube link]
- **Screenshots:** [PLACEHOLDER — landing page, 3D graph, readiness + gaps, roadmap, Copilot]
- **Run it locally:**

```bash
# backend
cd backend && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env   # add OPENROUTER_API_KEY, or set AI_PROVIDER=ollama
uvicorn main:app --reload --port 8000

# frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 and analyze a public repo. No hosted demo —
[PLACEHOLDER: remove this sentence if you deploy one].

## Code

- **Repository:** [PLACEHOLDER — public GitHub URL]
- **Open-weight AI layer:** `backend/services/llm_service.py`
- **AI features:** `backend/services/ai_service.py`, `chat_service.py`, `scoring_service.py`
- **3D graph:** `frontend/src/components/graph/`

## How I Built It

The app is a Next.js 14 / TypeScript / Tailwind frontend with a FastAPI backend
and a 3d-force-graph visualization. The interesting part is the AI layer.

Everything the app does with a model goes through one provider abstraction:

- **Hosted open model:** Gemma 4 26B A4B (`google/gemma-4-26b-a4b-it:free`,
  **Apache-2.0**) through OpenRouter.
- **Local open model:** Qwen2.5 7B Instruct (Apache-2.0) through Ollama on my own
  machine.
- **One env var** (`AI_PROVIDER`) switches between them. Model IDs are env vars
  too — no code changes.
- **Automatic fallback:** if a free endpoint is rate-limited or returns a
  reasoning-only response with no text, the backend tries the next configured
  model before giving up.
- **Cost control:** responses are cached for 24 hours, gap explanations are
  batched into a single call, and every AI call degrades to deterministic local
  heuristics instead of erroring out.

The open model is load-bearing: skill extraction, gap analysis, roadmaps,
what-if simulation, and the Copilot all depend on it. Remove it and the product
becomes a static résumé template.

## Why Does Open Innovation Matter?

Three reasons, all specific to this product:

1. **Privacy.** Career data is personal. With `AI_PROVIDER=ollama`, inference
   runs on the user's own laptop and the model never sends their repo text or
   skill profile to a third party. A closed API would make that impossible.
2. **Cost.** The people who need this most — students, bootcamp grads,
   career-switchers — are the least able to pay per-token API bills. Open
   weights plus a local model make the product viable at $0, and the hosted
   free tier makes it work on a machine without a GPU.
3. **No lock-in.** When one free hosted model was rate-limited upstream during
   development, I switched to another open model with one environment variable.
   A closed API means waiting, paying, or rewriting. Here, the fallback chain
   and the local path are both first-class.

Honest limit: inference runs offline, but fetching a public repo still needs
GitHub. The graph, readiness score, roadmap, and Copilot all work from data
already analyzed without a network connection.

## My Agent Session

[PLACEHOLDER — DevRelay link. Optional; remove this section if you don't record one.]

## My First User

- **Who:** [PLACEHOLDER — name/role, with permission]
- **What they did:** [PLACEHOLDER — e.g. analyzed their own repo, picked a target
  role, read the gap list and roadmap]
- **What they said:** [PLACEHOLDER — quote them verbatim]
- **Would they pay?** [PLACEHOLDER — yes/no/maybe and at what price]
- **What they asked for next:** [PLACEHOLDER]

## Prize Categories

[PLACEHOLDER — check the challenge page and list only the partner categories this
project actually qualifies for; remove this section if none apply.]

---

## Before publishing (delete this checklist)

- [ ] Replace every `[PLACEHOLDER]`
- [ ] Push the repo and confirm the link is public
- [ ] Record the 2–3 min demo (script in `RUNBOOK.md`)
- [ ] Test with one real user and quote them
- [ ] Remove the first-user and agent-session sections if unused
- [ ] Confirm no API key appears anywhere in the repo or screenshots
- [ ] Check the challenge page for prize categories and the DevRelay tag format
