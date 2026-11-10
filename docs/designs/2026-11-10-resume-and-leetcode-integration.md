# Design Document: Resume and LeetCode Integration

## Overview
PathForge is expanding its data ingestion pipeline to support **Resume** parsing (PDF file upload and plain-text paste) and **LeetCode** profile analysis alongside its existing GitHub and LinkedIn integrations. This enables candidate skill graphs to be enriched with algorithmic problem-solving proofs and documented work/project experience from resumes.

## Architecture

### 1. LeetCode Integration
- **Source**: Public LeetCode GraphQL API (`https://leetcode.com/graphql`).
- **Endpoint**: `POST /leetcode/analyze`
- **Payload**: `{"username": "<leetcode_username>"}`
- **Data Extracted**:
  - Problem statistics: Total solved, breakdown by difficulty (Easy, Medium, Hard), global ranking, reputation.
  - Language counts: Problems solved per programming language (C++, Python, Java, JavaScript, etc.).
  - Tag problem counts: Fundamental (Arrays, Strings, Sorting), Intermediate (Trees, Graphs, Binary Search), Advanced (Dynamic Programming, Backtracking, Trie, Segment Tree).
- **Graph Ingestion**:
  - Algorithmic topics become nodes with `category: "concept"` and `source: "leetcode"`.
  - Maturity is computed from problem count (e.g. 5+ problems = 50%, 20+ problems = 75%, 50+ problems = 90%).
  - Languages reinforce existing language nodes, upgrading their maturity and setting `source: "both"`.

### 2. Resume Integration
- **Endpoints**:
  - `POST /resume/upload`: Accepts `file: UploadFile` (`.pdf`, `.txt`, `.docx`) via `multipart/form-data`.
  - `POST /resume/analyze-text`: Accepts JSON with `resume_text: str`.
- **Parsing**:
  - Uses `pypdf.PdfReader` to extract text from PDF streams.
- **AI Skill & Entity Extraction**:
  - Leverages `services.ai_service.extract_skills` with `source_type="resume"`.
  - Extracts languages, frameworks, cloud/DevOps, databases, AI/ML tools, projects, and work experience.
- **Graph Ingestion**:
  - Extracted skills get `source: "resume"`.
  - Creates project nodes linked to detected technologies with `type: "USES"` or `type: "VALIDATES"`.
  - Merges into the existing graph avoiding duplicates while boosting node maturity.

### 3. Frontend & State
- **Stores**:
  - `authStore.ts`: tracks `leetcode_connected`, `leetcode_username`, `leetcode_stats`, `resume_connected`, `resume_filename`, `resume_skills`.
  - `graphStore.ts`: supports `FilterSource: 'all' | 'github' | 'linkedin' | 'leetcode' | 'resume'`.
- **UI Screens**:
  - `/setup`: 4-step onboarding (GitHub -> LeetCode -> Resume -> LinkedIn/Complete).
  - `/profile`: Cards for GitHub, LeetCode, Resume, and LinkedIn with live metrics, re-sync, and file upload.
  - `/dashboard`: Graph filters and node inspector displaying LeetCode and Resume evidence.

