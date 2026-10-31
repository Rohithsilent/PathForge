"""
Realistic market demand scores for technologies.
Based on job posting frequency, industry surveys (Stack Overflow, LinkedIn),
and hiring trends as of 2024-2025.

Scale: 0-100 (100 = extremely in-demand)
"""

MARKET_DEMAND: dict[str, int] = {
    # ── Languages ──
    "Python":       95,
    "JavaScript":   93,
    "TypeScript":   90,
    "Java":         85,
    "Go":           82,
    "Rust":         78,
    "C++":          75,
    "C#":           80,
    "Kotlin":       76,
    "Swift":        74,
    "Ruby":         60,
    "PHP":          58,
    "Scala":        65,
    "Dart":         68,
    "R":            62,
    "Julia":        55,
    "Perl":         35,
    "Lua":          45,
    "Shell":        70,
    "Elixir":       60,
    "Haskell":      45,
    "Clojure":      42,
    "Solidity":     65,

    # ── Frontend ──
    "React":        95,
    "Next.js":      92,
    "Vue.js":       78,
    "Angular":      75,
    "Svelte":       65,
    "Astro":        55,
    "Remix":        58,
    "Gatsby":       40,
    "jQuery":       35,
    "HTMX":         50,
    "HTML":         70,
    "CSS":          72,
    "SCSS":         60,
    "Tailwind CSS": 88,
    "Bootstrap":    55,
    "Material UI":  72,
    "Chakra UI":    62,
    "shadcn/ui":    75,
    "Framer Motion":68,
    "Three.js":     60,
    "D3.js":        58,
    "Recharts":     52,

    # ── Build tools ──
    "Webpack":      65,
    "Vite":         80,
    "Babel":        50,
    "Turbopack":    60,

    # ── Backend ──
    "Node.js":      92,
    "Express.js":   78,
    "FastAPI":      85,
    "Django":       76,
    "Flask":        65,
    "Spring Boot":  82,
    "NestJS":       75,
    "Rails":        55,
    "Hono":         55,
    "Fastify":      62,
    "ASP.NET":      72,
    "Gin":          68,
    "GraphQL":      74,
    "REST API":     85,
    "gRPC":         70,
    "WebSocket":    72,
    "Socket.IO":    62,
    "tRPC":         65,

    # ── Databases ──
    "PostgreSQL":   92,
    "MySQL":        78,
    "MongoDB":      80,
    "Redis":        85,
    "SQLite":       55,
    "Firebase":     72,
    "Supabase":     78,
    "DynamoDB":     75,
    "Neo4j":        55,
    "Elasticsearch":78,
    "SQL":          88,
    "Prisma":       80,
    "Mongoose":     65,
    "SQLAlchemy":   70,

    # ── ML / AI ──
    "Machine Learning": 92,
    "Deep Learning":    88,
    "PyTorch":      90,
    "TensorFlow":   82,
    "scikit-learn": 78,
    "Keras":        68,
    "Pandas":       85,
    "NumPy":        82,
    "OpenCV":       72,
    "NLP":          88,
    "Transformers": 90,
    "LangChain":    92,
    "OpenAI API":   90,
    "LLM":          95,
    "Gemini":       85,
    "Hugging Face": 85,
    "Computer Vision": 80,
    "Matplotlib":   58,
    "Jupyter":      65,
    "Streamlit":    72,
    "Gradio":       68,
    "MLflow":       72,
    "ONNX":         60,
    "XGBoost":      70,
    "FastAI":       55,

    # ── DevOps / Cloud ──
    "Docker":       92,
    "Kubernetes":   88,
    "AWS":          95,
    "GCP":          82,
    "Azure":        85,
    "Terraform":    85,
    "CI/CD":        88,
    "GitHub Actions":82,
    "Jenkins":      65,
    "Linux":        85,
    "Nginx":        72,
    "Vercel":       75,
    "Netlify":      58,
    "Heroku":       40,
    "Cloudflare":   78,
    "Git":          90,
    "GitHub":       85,
    "Prometheus":   72,
    "Grafana":      70,
    "Sentry":       68,

    # ── Auth ──
    "JWT":          78,
    "OAuth":        75,
    "Auth0":        68,
    "NextAuth.js":  72,
    "Clerk":        65,

    # ── Mobile ──
    "Flutter":      78,
    "React Native": 80,
    "Android":      82,
    "iOS":          80,
    "SwiftUI":      72,
    "Expo":         68,

    # ── Testing ──
    "Jest":         78,
    "Cypress":      72,
    "Playwright":   75,
    "pytest":       74,
    "Selenium":     60,
    "Vitest":       68,

    # ── State management ──
    "Redux":        70,
    "Zustand":      72,
    "MobX":         50,

    # ── Messaging ──
    "Kafka":        82,
    "RabbitMQ":     70,
    "Celery":       65,

    # ── Concepts ──
    "Microservices":  85,
    "Serverless":     78,
    "System Design":  90,
    "API Design":     82,
    "Authentication": 80,
    "Web Scraping":   62,
    "Real-time":      75,
    "Responsive Design": 70,
    "Blockchain":     55,
    "Caching":        78,
    "Notion API":     45,

    # ── Payments ──
    "Stripe":       78,
}

DEFAULT_DEMAND = 60  # fallback for unlisted techs


def get_market_demand(tech_name: str) -> int:
    """Get realistic market demand for a technology."""
    # Try exact match first
    if tech_name in MARKET_DEMAND:
        return MARKET_DEMAND[tech_name]
    # Try case-insensitive
    lower = tech_name.lower()
    for name, score in MARKET_DEMAND.items():
        if name.lower() == lower:
            return score
    return DEFAULT_DEMAND
