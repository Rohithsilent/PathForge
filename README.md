# PathForge — Interactive 3D Knowledge Graph & Career Intelligence Platform

> **AI-powered Career Intelligence Platform** that transforms GitHub repositories, LinkedIn profiles, and certifications into verified developer skills, interactive 3D knowledge graphs, quantified hiring readiness scores, and AI career coaching.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Frontend](https://img.shields.io/badge/Next.js-14.2-black.svg)
![Backend](https://img.shields.io/badge/FastAPI-1.0-teal.svg)
![3D Engine](https://img.shields.io/badge/Three.js-R3F-orange.svg)
![Cost](https://img.shields.io/badge/Cost-$0-brightgreen.svg)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen.svg)

---

## ✨ Key Features

### 🔮 1. Interactive 3D Knowledge Graph
- **Physics-Driven 3D Simulation**: Force-directed 3D graph powered by Three.js, React Three Fiber (`@react-three/fiber`), and `d3-force-3d`.
- **Dynamic Node Badges & Icons**: Real SVG brand icons (React, TypeScript, Python, Docker, Flutter, etc.) and maturity badges for every skill.
- **Node Selection & Subgraph Isolation**: Selecting any node automatically isolates only that node and its directly connected neighbors and links, decluttering large graphs for maximum clarity.
- **Connected Link Highlighting**: Links connected to the active node illuminate in vibrant brand orange with legible relationship labels.
- **Floating Focused Node Bar**: Includes a 1-click **"Show All"** reset button and category indicators.
- **2D WebGL Fallback View**: Graceful degradation to an interactive 2D node map if hardware WebGL acceleration is unavailable in the browser environment.
- **Market Demand Overlay**: Visualizes real-time tech market demand percentage with high/medium/low color-coded glowing pulses.

### 📱 2. Mobile-First Responsive Design
- **Collapsible Sources & Repositories Panel**: Filters panel automatically minimizes on mobile viewports (`<768px`) to prevent crowding the canvas and yield **90%+ vertical space** to the 3D graph.
- **Smooth Animations**: Animated expand/collapse powered by Framer Motion.
- **Scrollable Repository Filters**: Repo list height is smartly constrained so large repository collections never overflow the viewport.

### ⚡ 3. Deep Multi-Signal Repository Analysis
- **Multi-Signal Scanning**:
  - **Language Detection**: Reads all languages detected by GitHub API (`WRITTEN_IN` links).
  - **Tech Directory Deep Scans**: Analyzes README files, repo topics, and descriptions against a comprehensive tech directory (`Flutter`, `Firebase`, `Docker`, `HTTPS`, `Authentication`, `Real-time`, `Web Scraping`, etc.) creating `USES` links.
  - **Concept & Tag Extraction**: Links related software engineering concepts, paradigms, and libraries.
- **Multi-Repo Association**: Skills appearing across multiple repositories are accurately linked with `repos: [repo_names]` array tags.
- **Persistent Graph Caching**: Analyzed graphs persist in `backend/data/active_graph.json` and sync seamlessly across reloads.

### 🔐 4. Multi-Provider Authentication & Smart Onboarding
- **Firebase Google Authentication**: Fast, secure 1-click Google Sign-In via Firebase Auth.
- **GitHub OAuth Integration**: Connect your GitHub account to automatically pull public repositories for instant skill graph generation.
- **LinkedIn Integration**: Connect and ingest LinkedIn profile data to surface verified certifications, work history, and endorsements.
- **Smart Onboarding Flow**:
  - The `/setup` onboarding flow is **only prompted for new users**.
  - Returning users who have already selected their target role are automatically routed directly to their personalized `/dashboard`.
- **User Profile Persistence**: User settings and connected account statuses are stored securely in `backend/data/users/`.

### 👤 5. Public Sharable Profiles & Social Proof
- **Dedicated Profile Page (`/profile`)**: Manage connected accounts (Google, GitHub, LinkedIn), update target roles, and view profile health.
- **Sharable Public URL (`/profile/[slug]`)**: Share your verified developer graph and readiness card with recruiters and peers.
- **1-Click LinkedIn Sharing**: Post your verified skill portfolio directly to LinkedIn with pre-composed hiring highlights.

### 📊 6. AI Career Readiness & Skill Gap Analysis
- **0–100 Readiness Benchmark**: Quantified career readiness score tailored to target roles (e.g. *Full Stack Developer*, *ML Engineer*, *DevOps Specialist*).
- **Prioritized Gap Breakdown**: Highlights missing critical skills and frameworks required for your dream job with actionable next steps.

### 🤖 7. AI Career Copilot & What-If Simulator
- **Interactive Copilot Chat**: Career assistant powered by open-weight LLMs (Ollama or OpenRouter) with direct context of your scanned GitHub repositories.
- **What-If Simulator**: Predicts the exact score boost and career impact before you learn a new framework or tool (*e.g. "Learning PyTorch will raise your ML Readiness score by +16%"*).

### 👔 8. Recruiter Intelligence & Analytics
- **Recruiter Evaluation Mode**: Generates a high-level candidate scorecard, strengths assessment, and radar chart.
- **Exportable PDF Report**: Generate clean candidate summaries formatted for technical hiring managers.
- **Analytics Dashboard (`/dashboard/analytics`)**: Visualizes category breakdowns, language distributions, and maturity metrics across charts.

---

## 🏗️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | Next.js 14.2 (App Router) | React 18, TypeScript, Tailwind CSS |
| **3D Graph Engine** | React Three Fiber + Three.js | `@react-three/fiber`, `@react-three/drei`, `d3-force-3d` |
| **State Management** | Zustand | Persistent client stores for graph, auth, and skills |
| **Animations** | Framer Motion | Smooth drawer, modal, and filter animations |
| **Authentication** | Firebase Auth + GitHub OAuth | Google Sign-In, GitHub OAuth token exchange, JWT |
| **Charts** | Recharts | Radar, area, bar, and pie charts |
| **Backend Framework** | FastAPI (Python 3.10+) | Uvicorn, Pydantic v2, CORS middleware |
| **AI Inference** | Open-Weight Models | Gemma 4, Qwen2.5, Nemotron via OpenRouter or local Ollama |
| **Data Persistence** | JSON Datastore & Neo4j | `backend/data/` for users & graphs, optional Neo4j AuraDB |

**Total Infrastructure Cost: $0 (Runs entirely on free and open-source tiers)**

---

## 📁 Project Structure

```
PathForge/
├── backend/
│   ├── main.py                  # FastAPI entry point & router registration
│   ├── config.py                # Environment configuration (Pydantic settings)
│   ├── seed_data.py             # Demo dataset fallback
│   ├── data/                    # Persistent local storage
│   │   ├── active_graph.json    # Active analyzed knowledge graph cache
│   │   └── users/               # User profiles (JSON store)
│   ├── routes/                  # API endpoints
│   │   ├── auth.py              # Firebase & GitHub authentication routes
│   │   ├── user.py              # User profile & onboarding status
│   │   ├── profile.py           # Public sharable profile routes
│   │   ├── github.py            # Repo & profile analysis pipeline
│   │   ├── linkedin.py          # LinkedIn profile ingestion
│   │   ├── graph.py             # Active & demo graph endpoints
│   │   ├── career.py            # Readiness scores & gap analysis
│   │   ├── recruiter.py         # Recruiter summaries & candidate evaluation
│   │   ├── chat.py              # AI Copilot chat streaming
│   │   ├── notion.py            # Notion integration (optional)
│   │   └── certifications.py    # Certification tracking
│   ├── services/                # Core business logic
│   │   ├── github_service.py    # GitHub API integration & repo fetching
│   │   ├── repo_analyzer.py     # Multi-signal code & README deep analyzer
│   │   ├── tech_directory.py    # Comprehensive tech catalog & detection rules
│   │   ├── user_service.py      # User profile CRUD & persistence
│   │   ├── graph_service.py     # Graph store & persistence logic
│   │   ├── scoring_service.py   # Career readiness algorithm
│   │   ├── ai_service.py        # AI skill extraction & reasoning
│   │   ├── llm_service.py       # LLM provider gateway (Ollama / OpenRouter)
│   │   └── linkedin_service.py  # LinkedIn parsing logic
│   └── schemas/
│       └── schemas.py           # Pydantic request/response models
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── page.tsx         # Modern SaaS landing page & single-repo analyzer
│   │   │   ├── login/           # Google & GitHub sign-in page
│   │   │   ├── setup/           # New user onboarding & target role selector
│   │   │   ├── profile/         # User account & connected services dashboard
│   │   │   │   └── [slug]/      # Public shareable profile page
│   │   │   ├── dashboard/       # Main 3D knowledge graph workspace
│   │   │   │   └── analytics/   # Analytics & chart breakdowns
│   │   │   └── auth/callback/   # GitHub OAuth redirect handler
│   │   ├── components/
│   │   │   ├── graph/           # 3D Knowledge graph, filters & search
│   │   │   │   ├── KnowledgeGraph3D.tsx # R3F Canvas & force simulation
│   │   │   │   └── GraphFilters.tsx     # Responsive collapsible filter panel
│   │   │   ├── panels/          # Copilot, Insight, Recruiter & Roadmap drawers
│   │   │   └── layout/          # Topbar, Navigation, Modals
│   │   ├── stores/              # Zustand state stores (graph, auth, skill)
│   │   └── lib/                 # API client, Firebase config, tech metadata
│   └── package.json
├── .env.example                 # Global environment configuration template
├── docker-compose.yml           # Container orchestration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+
- *(Optional)* [Ollama](https://ollama.com/) for 100% offline local AI inference

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

The backend will be live at `http://localhost:8000`. Test the health check at `http://localhost:8000/health`.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure local environment variables
cp ../.env.example .env.local

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Authentication & API Configuration

### Firebase Google Sign-In Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and add **Google** as a Sign-in provider.
3. In **Project Settings** > **General**, register a Web App and copy the config values into `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. In **Project Settings** > **Service Accounts**, click **Generate new private key** and save the file as `backend/serviceAccountKey.json`.

### GitHub OAuth Setup (Optional)
1. Go to **GitHub Settings** > **Developer Settings** > **OAuth Apps** > **New OAuth App**.
2. Set Authorization callback URL to: `http://localhost:3000/auth/callback`.
3. Add your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `backend/.env`.

---

## 🧠 AI Inference Options

PathForge is built exclusively on **open-weight models**, ensuring you never have to pay for expensive proprietary LLM tokens.

Configure your provider via `AI_PROVIDER` in `backend/.env`:

| Mode | Provider Setting | Notes |
|---|---|---|
| **Hosted Open-Weight (Default)** | `AI_PROVIDER=openrouter` | Uses free open-weight models (`google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free`) via OpenRouter. |
| **Local Offline Inference** | `AI_PROVIDER=ollama` | 100% private. Run `ollama run qwen2.5:7b-instruct` on your machine. |
| **Deterministic Fallback** | Automatic | If AI providers are offline or rate-limited, local pattern-matching heuristic engines ensure full zero-downtime operation. |

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/auth/firebase` | `POST` | Authenticates Firebase Google user and syncs profile |
| `/auth/github/login` | `GET` | Initiates GitHub OAuth authentication flow |
| `/auth/github/callback` | `GET` | Exchanges GitHub OAuth code for user access token |
| `/user/me` | `GET` | Retrieves authenticated user profile & connected accounts |
| `/user/onboarding` | `POST` | Completes initial target role onboarding flow |
| `/user/account` | `DELETE` | Deletes user profile and resets stored credentials |
| `/profile/{username}` | `GET` | Public developer profile summary & verified skill badges |
| `/github/analyze-profile` | `POST` | Multi-repo deep scan and skill extraction |
| `/github/analyze` | `POST` | Single-repo analysis directly from landing page |
| `/linkedin/ingest` | `POST` | Ingests LinkedIn profile information and endorsements |
| `/graph/` | `GET` | Retrieves active 3D knowledge graph nodes & links |
| `/graph/demo` | `POST` | Seeds demo graph dataset for instant testing |
| `/career/readiness` | `GET` | Calculates target role readiness score (0-100) and gaps |
| `/career/simulate` | `POST` | What-If simulator: estimates score boost for added skills |
| `/chat/` | `POST` | AI Career Copilot interactive advice |
| `/recruiter/summary` | `GET` | Recruiter-friendly scorecard and skill radar metrics |

---

## 🎯 PS9 Requirements Coverage

| Requirement | Implementation Details | Status |
|---|---|:---:|
| **GitHub Data Extraction** | Live repo fetching, commit history, language breakdown, and deep file scanning | ✅ |
| **Multi-Source Integration** | GitHub repositories, LinkedIn profiles, and certifications | ✅ |
| **NLP Skill Extraction** | Open-weight LLMs + deep AST & keyword pattern-matching | ✅ |
| **Graph Database** | Interactive graph model with in-memory persistence and Neo4j AuraDB support | ✅ |
| **Interactive 3D Visualization** | React Three Fiber, Three.js, d3-force-3d, camera controls & dynamic sprites | ✅ |
| **Node Focus & Subgraph Isolation** | Clicking a node isolates only connected neighbors and links | ✅ |
| **Responsive Mobile Layout** | Collapsible filter panel optimizing viewport space for mobile 3D visualization | ✅ |
| **Search & Real-time Filter** | Instant text search, category filters, and source pills | ✅ |
| **Skill Gap Analysis** | Compares scanned skills against industry role benchmarks | ✅ |
| **Career Roadmap** | Step-by-step milestones to close identified technical gaps | ✅ |
| **What-If Simulator** | Dynamic recalculation of career readiness score when learning new skills | ✅ |
| **Recruiter Mode** | Radar skill analysis, hiring manager scorecard, and PDF export | ✅ |
| **Market Demand Overlay** | High/medium/low market demand color intensity and glowing pulses | ✅ |
| **User Authentication** | Firebase Google Sign-In, GitHub OAuth, and session tokens | ✅ |
| **Public Developer Profiles** | Shareable `/profile/[slug]` route with direct 1-click LinkedIn post sharing | ✅ |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
