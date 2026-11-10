"""
Comprehensive technology directory for knowledge graph extraction.
Maps canonical tech names to their category and common aliases/variations.
"""

from typing import Dict, List, Tuple


# Each entry: canonical_name -> (category, [aliases])
# Aliases are matched case-insensitively against README text
TECH_DIRECTORY: Dict[str, Tuple[str, List[str]]] = {

    # ═══════════════════════════════════════════
    #  PROGRAMMING LANGUAGES
    # ═══════════════════════════════════════════
    "Python":       ("backend",  ["python", "python3", "py", ".py"]),
    "JavaScript":   ("frontend", ["javascript", "js", "ecmascript", "es6", "es2015"]),
    "TypeScript":   ("frontend", ["typescript", "ts", ".tsx", ".ts"]),
    "Java":         ("backend",  ["java", "jdk", "jre", "jvm", "openjdk"]),
    "Kotlin":       ("mobile",   ["kotlin", ".kt"]),
    "Swift":        ("mobile",   ["swift", "swiftlang"]),
    "C++":          ("backend",  ["c++", "cpp", "cplusplus"]),
    "C#":           ("backend",  ["c#", "csharp", "dotnet", ".net"]),
    "C":            ("backend",  ["c language", "clang"]),
    "Go":           ("backend",  ["golang", "go lang"]),
    "Rust":         ("backend",  ["rust", "rustlang", "cargo"]),
    "Ruby":         ("backend",  ["ruby", "rb"]),
    "PHP":          ("backend",  ["php", "laravel"]),
    "Scala":        ("backend",  ["scala"]),
    "Dart":         ("mobile",   ["dart"]),
    "Lua":          ("backend",  ["lua"]),
    "R":            ("ml",       ["r language", "rstats", "r programming"]),
    "Julia":        ("ml",       ["julia", "julialang"]),
    "Perl":         ("backend",  ["perl"]),
    "Elixir":       ("backend",  ["elixir", "phoenix"]),
    "Haskell":      ("backend",  ["haskell"]),
    "Clojure":      ("backend",  ["clojure"]),
    "Shell":        ("devops",   ["shell", "bash", "zsh", "sh script"]),
    "PowerShell":   ("devops",   ["powershell"]),
    "Solidity":     ("backend",  ["solidity", "smart contract"]),

    # ═══════════════════════════════════════════
    #  FRONTEND FRAMEWORKS & LIBRARIES
    # ═══════════════════════════════════════════
    "React":        ("frontend", ["react", "reactjs", "react.js", "react js"]),
    "Next.js":      ("frontend", ["next.js", "nextjs", "next js", "next-js", "next app"]),
    "Vue.js":       ("frontend", ["vue", "vuejs", "vue.js", "vue 3", "vue3", "nuxt"]),
    "Angular":      ("frontend", ["angular", "angularjs", "angular.js", "ng "]),
    "Svelte":       ("frontend", ["svelte", "sveltekit"]),
    "Astro":        ("frontend", ["astro"]),
    "Remix":        ("frontend", ["remix"]),
    "Gatsby":       ("frontend", ["gatsby"]),
    "Solid.js":     ("frontend", ["solid.js", "solidjs"]),
    "Preact":       ("frontend", ["preact"]),
    "Ember.js":     ("frontend", ["ember", "ember.js"]),
    "jQuery":       ("frontend", ["jquery"]),
    "Alpine.js":    ("frontend", ["alpine.js", "alpinejs"]),
    "HTMX":         ("frontend", ["htmx"]),
    "Lit":          ("frontend", ["lit element", "lit-element"]),

    # ═══════════════════════════════════════════
    #  CSS & STYLING
    # ═══════════════════════════════════════════
    "HTML":         ("frontend", ["html", "html5"]),
    "CSS":          ("frontend", ["css", "css3", "stylesheet"]),
    "SCSS":         ("frontend", ["scss", "sass"]),
    "Tailwind CSS": ("frontend", ["tailwind", "tailwindcss", "tailwind css", "tailwind.config"]),
    "Bootstrap":    ("frontend", ["bootstrap"]),
    "Material UI":  ("frontend", ["material-ui", "material ui", "@mui", "mui"]),
    "Chakra UI":    ("frontend", ["chakra", "chakra-ui", "chakra ui"]),
    "Ant Design":   ("frontend", ["antd", "ant design", "ant-design"]),
    "Styled Components": ("frontend", ["styled-components", "styled components"]),
    "Emotion":      ("frontend", ["@emotion", "emotion css"]),
    "Radix UI":     ("frontend", ["radix", "@radix", "radix-ui"]),
    "shadcn/ui":    ("frontend", ["shadcn", "shadcn/ui", "shadcn-ui"]),
    "DaisyUI":      ("frontend", ["daisyui", "daisy ui"]),

    # ═══════════════════════════════════════════
    #  BUILD TOOLS & BUNDLERS
    # ═══════════════════════════════════════════
    "Webpack":      ("frontend", ["webpack"]),
    "Vite":         ("frontend", ["vite", "vite.config"]),
    "Rollup":       ("frontend", ["rollup"]),
    "esbuild":      ("frontend", ["esbuild"]),
    "Turbopack":    ("frontend", ["turbopack"]),
    "Babel":        ("frontend", ["babel", ".babelrc"]),
    "SWC":          ("frontend", ["swc"]),
    "PostCSS":      ("frontend", ["postcss"]),
    "Parcel":       ("frontend", ["parcel"]),

    # ═══════════════════════════════════════════
    #  ANIMATION & VISUALIZATION
    # ═══════════════════════════════════════════
    "Framer Motion":("frontend", ["framer-motion", "framer motion"]),
    "GSAP":         ("frontend", ["gsap", "greensock"]),
    "Three.js":     ("frontend", ["three.js", "threejs", "three js"]),
    "D3.js":        ("frontend", ["d3.js", "d3js", "d3 "]),
    "Chart.js":     ("frontend", ["chart.js", "chartjs"]),
    "Recharts":     ("frontend", ["recharts"]),
    "Lottie":       ("frontend", ["lottie"]),
    "P5.js":        ("frontend", ["p5.js", "p5js"]),
    "PixiJS":       ("frontend", ["pixi", "pixijs"]),
    "Canvas API":   ("frontend", ["canvas api", "<canvas"]),

    # ═══════════════════════════════════════════
    #  BACKEND FRAMEWORKS
    # ═══════════════════════════════════════════
    "Node.js":      ("backend",  ["node.js", "nodejs", "node js", "node"]),
    "Express.js":   ("backend",  ["express", "expressjs", "express.js"]),
    "FastAPI":      ("backend",  ["fastapi", "fast-api", "fast api"]),
    "Django":       ("backend",  ["django"]),
    "Flask":        ("backend",  ["flask"]),
    "Spring Boot":  ("backend",  ["spring boot", "spring-boot", "springboot", "spring"]),
    "NestJS":       ("backend",  ["nestjs", "nest.js", "nest js"]),
    "Koa":          ("backend",  ["koa"]),
    "Hono":         ("backend",  ["hono"]),
    "Fastify":      ("backend",  ["fastify"]),
    "Rails":        ("backend",  ["rails", "ruby on rails"]),
    "ASP.NET":      ("backend",  ["asp.net", "aspnet"]),
    "Gin":          ("backend",  ["gin gonic", "gin "]),
    "Fiber":        ("backend",  ["fiber go", "gofiber"]),
    "Actix":        ("backend",  ["actix"]),

    # ═══════════════════════════════════════════
    #  API & COMMUNICATION
    # ═══════════════════════════════════════════
    "GraphQL":      ("backend",  ["graphql", "apollo", "hasura"]),
    "REST API":     ("backend",  ["rest api", "restful", "rest "]),
    "gRPC":         ("backend",  ["grpc"]),
    "WebSocket":    ("backend",  ["websocket", "ws://", "wss://"]),
    "Socket.IO":    ("backend",  ["socket.io", "socketio"]),
    "tRPC":         ("backend",  ["trpc"]),
    "Swagger":      ("backend",  ["swagger", "openapi"]),
    "Postman":      ("devops",   ["postman"]),

    # ═══════════════════════════════════════════
    #  DATABASES
    # ═══════════════════════════════════════════
    "PostgreSQL":   ("database", ["postgresql", "postgres", "psql"]),
    "MySQL":        ("database", ["mysql"]),
    "MongoDB":      ("database", ["mongodb", "mongo", "mongoose"]),
    "Redis":        ("database", ["redis"]),
    "SQLite":       ("database", ["sqlite", "sqlite3"]),
    "Firebase":     ("database", ["firebase", "firestore"]),
    "Supabase":     ("database", ["supabase"]),
    "DynamoDB":     ("database", ["dynamodb"]),
    "Neo4j":        ("database", ["neo4j"]),
    "Elasticsearch":("database", ["elasticsearch", "elastic search", "elk"]),
    "CockroachDB":  ("database", ["cockroachdb"]),
    "Cassandra":    ("database", ["cassandra"]),
    "CouchDB":      ("database", ["couchdb"]),
    "InfluxDB":     ("database", ["influxdb"]),
    "SQL":          ("database", ["sql"]),
    "PlanetScale":  ("database", ["planetscale"]),
    "Neon":         ("database", ["neon database", "neon db"]),
    "Turso":        ("database", ["turso"]),

    # ═══════════════════════════════════════════
    #  ORMs & DATABASE TOOLS
    # ═══════════════════════════════════════════
    "Prisma":       ("database", ["prisma"]),
    "Mongoose":     ("database", ["mongoose"]),
    "Sequelize":    ("database", ["sequelize"]),
    "TypeORM":      ("database", ["typeorm"]),
    "Drizzle ORM":  ("database", ["drizzle"]),
    "SQLAlchemy":   ("database", ["sqlalchemy"]),
    "Knex.js":      ("database", ["knex"]),

    # ═══════════════════════════════════════════
    #  ML / AI / DATA SCIENCE
    # ═══════════════════════════════════════════
    "Machine Learning": ("ml", ["machine learning", "ml model"]),
    "Deep Learning":    ("ml", ["deep learning", "neural network"]),
    "PyTorch":      ("ml",  ["pytorch", "torch"]),
    "TensorFlow":   ("ml",  ["tensorflow", "tf."]),
    "scikit-learn": ("ml",  ["scikit-learn", "sklearn"]),
    "Keras":        ("ml",  ["keras"]),
    "Pandas":       ("ml",  ["pandas"]),
    "NumPy":        ("ml",  ["numpy"]),
    "SciPy":        ("ml",  ["scipy"]),
    "OpenCV":       ("ml",  ["opencv", "cv2"]),
    "Computer Vision":("ml",["computer vision"]),
    "NLP":          ("ml",  ["nlp", "natural language processing", "text processing"]),
    "Transformers": ("ml",  ["transformers", "huggingface", "hugging face", "hf "]),
    "LangChain":    ("ml",  ["langchain"]),
    "LlamaIndex":   ("ml",  ["llamaindex", "llama index"]),
    "OpenAI API":   ("ml",  ["openai", "gpt-4", "gpt-3", "chatgpt"]),
    "LLM":          ("ml",  ["llm", "large language model"]),
    "Gemini":       ("ml",  ["gemini", "google ai"]),
    "Claude":       ("ml",  ["claude", "anthropic"]),
    "Stable Diffusion": ("ml", ["stable diffusion", "diffusion model"]),
    "YOLO":         ("ml",  ["yolo", "yolov"]),
    "Matplotlib":   ("ml",  ["matplotlib", "pyplot"]),
    "Seaborn":      ("ml",  ["seaborn"]),
    "Plotly":       ("ml",  ["plotly"]),
    "Jupyter":      ("ml",  ["jupyter", "notebook", ".ipynb"]),
    "MLflow":       ("ml",  ["mlflow"]),
    "Weights & Biases": ("ml", ["wandb", "weights & biases", "weights and biases"]),
    "Ray":          ("ml",  ["ray serve", "ray tune"]),
    "ONNX":         ("ml",  ["onnx"]),
    "JAX":          ("ml",  ["jax "]),
    "XGBoost":      ("ml",  ["xgboost"]),
    "LightGBM":     ("ml",  ["lightgbm"]),
    "CatBoost":     ("ml",  ["catboost"]),
    "FastAI":       ("ml",  ["fastai", "fast.ai"]),
    "Streamlit":    ("ml",  ["streamlit"]),
    "Gradio":       ("ml",  ["gradio"]),

    # ═══════════════════════════════════════════
    #  DEVOPS / CLOUD / INFRASTRUCTURE
    # ═══════════════════════════════════════════
    "Docker":       ("devops",  ["docker", "dockerfile", "docker-compose", "docker compose"]),
    "Kubernetes":   ("devops",  ["kubernetes", "k8s", "kubectl", "helm"]),
    "AWS":          ("devops",  ["aws", "amazon web services", "s3", "ec2", "lambda", "cloudfront"]),
    "GCP":          ("devops",  ["gcp", "google cloud"]),
    "Azure":        ("devops",  ["azure", "microsoft azure"]),
    "Terraform":    ("devops",  ["terraform", "tf "]),
    "Ansible":      ("devops",  ["ansible"]),
    "Pulumi":       ("devops",  ["pulumi"]),
    "CI/CD":        ("devops",  ["ci/cd", "ci cd", "continuous integration", "continuous deployment"]),
    "GitHub Actions":("devops", ["github actions", "github-actions", ".github/workflows"]),
    "Jenkins":      ("devops",  ["jenkins"]),
    "CircleCI":     ("devops",  ["circleci"]),
    "Travis CI":    ("devops",  ["travis", "travisci"]),
    "GitLab CI":    ("devops",  ["gitlab-ci", "gitlab ci"]),
    "ArgoCD":       ("devops",  ["argocd"]),
    "Nginx":        ("devops",  ["nginx"]),
    "Apache":       ("devops",  ["apache"]),
    "Caddy":        ("devops",  ["caddy"]),
    "Linux":        ("devops",  ["linux", "ubuntu", "debian", "centos"]),
    "Prometheus":   ("devops",  ["prometheus"]),
    "Grafana":      ("devops",  ["grafana"]),
    "Datadog":      ("devops",  ["datadog"]),
    "Sentry":       ("devops",  ["sentry"]),
    "New Relic":    ("devops",  ["new relic"]),

    # ═══════════════════════════════════════════
    #  HOSTING & DEPLOYMENT
    # ═══════════════════════════════════════════
    "Vercel":       ("devops",  ["vercel"]),
    "Netlify":      ("devops",  ["netlify"]),
    "Heroku":       ("devops",  ["heroku"]),
    "Railway":      ("devops",  ["railway"]),
    "Render":       ("devops",  ["render"]),
    "Fly.io":       ("devops",  ["fly.io"]),
    "DigitalOcean": ("devops",  ["digitalocean"]),
    "Cloudflare":   ("devops",  ["cloudflare", "cloudflare workers"]),

    # ═══════════════════════════════════════════
    #  VERSION CONTROL & TOOLS
    # ═══════════════════════════════════════════
    "Git":          ("devops",  ["git "]),
    "GitHub":       ("devops",  ["github"]),
    "GitLab":       ("devops",  ["gitlab"]),
    "Bitbucket":    ("devops",  ["bitbucket"]),

    # ═══════════════════════════════════════════
    #  AUTH & SECURITY
    # ═══════════════════════════════════════════
    "JWT":          ("backend", ["jwt", "json web token"]),
    "OAuth":        ("backend", ["oauth", "oauth2"]),
    "Auth0":        ("backend", ["auth0"]),
    "NextAuth.js":  ("backend", ["nextauth", "next-auth"]),
    "Clerk":        ("backend", ["clerk"]),
    "Passport.js":  ("backend", ["passport", "passport.js"]),
    "Firebase Auth":("backend", ["firebase auth", "firebase authentication"]),
    "Supabase Auth":("backend", ["supabase auth"]),
    "Keycloak":     ("backend", ["keycloak"]),
    "CORS":         ("backend", ["cors"]),
    "HTTPS":        ("backend", ["https", "ssl", "tls"]),

    # ═══════════════════════════════════════════
    #  MOBILE
    # ═══════════════════════════════════════════
    "Flutter":      ("mobile", ["flutter"]),
    "React Native": ("mobile", ["react native", "react-native"]),
    "Expo":         ("mobile", ["expo"]),
    "Android":      ("mobile", ["android"]),
    "iOS":          ("mobile", ["ios"]),
    "SwiftUI":      ("mobile", ["swiftui"]),
    "Jetpack Compose": ("mobile", ["jetpack compose"]),
    "Capacitor":    ("mobile", ["capacitor"]),
    "Ionic":        ("mobile", ["ionic"]),
    "Xamarin":      ("mobile", ["xamarin"]),

    # ═══════════════════════════════════════════
    #  TESTING
    # ═══════════════════════════════════════════
    "Jest":         ("devops",  ["jest"]),
    "Mocha":        ("devops",  ["mocha"]),
    "Vitest":       ("devops",  ["vitest"]),
    "pytest":       ("devops",  ["pytest"]),
    "Cypress":      ("devops",  ["cypress"]),
    "Playwright":   ("devops",  ["playwright"]),
    "Selenium":     ("devops",  ["selenium"]),
    "Testing Library": ("devops", ["testing-library", "testing library", "@testing-library"]),
    "Storybook":    ("devops",  ["storybook"]),

    # ═══════════════════════════════════════════
    #  STATE MANAGEMENT
    # ═══════════════════════════════════════════
    "Redux":        ("frontend", ["redux"]),
    "Zustand":      ("frontend", ["zustand"]),
    "MobX":         ("frontend", ["mobx"]),
    "Recoil":       ("frontend", ["recoil"]),
    "Jotai":        ("frontend", ["jotai"]),
    "Pinia":        ("frontend", ["pinia"]),
    "Vuex":         ("frontend", ["vuex"]),
    "Context API":  ("frontend", ["usecontext", "context api"]),

    # ═══════════════════════════════════════════
    #  MESSAGING & QUEUES
    # ═══════════════════════════════════════════
    "RabbitMQ":     ("backend", ["rabbitmq"]),
    "Kafka":        ("backend", ["kafka"]),
    "Celery":       ("backend", ["celery"]),
    "Bull":         ("backend", ["bullmq", "bull queue"]),
    "SQS":          ("devops",  ["sqs", "amazon sqs"]),

    # ═══════════════════════════════════════════
    #  PAYMENT & SERVICES
    # ═══════════════════════════════════════════
    "Stripe":       ("backend", ["stripe"]),
    "PayPal":       ("backend", ["paypal"]),
    "Twilio":       ("backend", ["twilio"]),
    "SendGrid":     ("backend", ["sendgrid"]),
    "Resend":       ("backend", ["resend"]),

    # ═══════════════════════════════════════════
    #  HEADLESS CMS & CONTENT
    # ═══════════════════════════════════════════
    "Sanity":       ("backend", ["sanity"]),
    "Contentful":   ("backend", ["contentful"]),
    "Strapi":       ("backend", ["strapi"]),
    "WordPress":    ("backend", ["wordpress"]),
    "Notion API":   ("backend", ["notion api", "notion integration"]),

    # ═══════════════════════════════════════════
    #  REALTIME & MISC
    # ═══════════════════════════════════════════
    "Convex":       ("backend", ["convex"]),
    "Appwrite":     ("backend", ["appwrite"]),
    "Pocketbase":   ("backend", ["pocketbase"]),
    "Upstash":      ("database", ["upstash"]),
    "Pinecone":     ("database", ["pinecone"]),
    "Weaviate":     ("database", ["weaviate"]),
    "Chroma":       ("database", ["chromadb", "chroma"]),
    "Milvus":       ("database", ["milvus"]),
    "FAISS":        ("ml",      ["faiss"]),

    # ═══════════════════════════════════════════
    #  CONCEPTS (non-tool, but important)
    # ═══════════════════════════════════════════
    "Microservices":  ("concept", ["microservices", "microservice"]),
    "Monorepo":       ("concept", ["monorepo", "turborepo"]),
    "Serverless":     ("concept", ["serverless"]),
    "Edge Computing": ("concept", ["edge function", "edge computing"]),
    "System Design":  ("concept", ["system design"]),
    "API Design":     ("concept", ["api design"]),
    "Authentication": ("concept", ["authentication", "auth"]),
    "Authorization":  ("concept", ["authorization", "rbac"]),
    "Web Scraping":   ("concept", ["web scraping", "scraper", "beautifulsoup", "scrapy", "puppeteer", "cheerio"]),
    "Data Pipeline":  ("concept", ["data pipeline", "etl"]),
    "Real-time":      ("concept", ["real-time", "realtime"]),
    "Responsive Design": ("concept", ["responsive", "mobile-first"]),
    "SEO":            ("concept", ["seo"]),
    "Accessibility":  ("concept", ["accessibility", "a11y", "wcag"]),
    "PWA":            ("concept", ["pwa", "progressive web app"]),
    "SSR":            ("concept", ["ssr", "server-side rendering"]),
    "SSG":            ("concept", ["ssg", "static site generation"]),
    "ISR":            ("concept", ["isr", "incremental static"]),
    "Caching":        ("concept", ["caching", "cache"]),
    "Rate Limiting":  ("concept", ["rate limit"]),
    "Pagination":     ("concept", ["pagination"]),
    "File Upload":    ("concept", ["file upload", "multer", "multipart"]),
    "Image Processing": ("concept", ["image processing"]),
    "Blockchain":     ("concept", ["blockchain", "web3", "ethereum", "solana"]),
    "IoT":            ("concept", ["iot", "internet of things", "mqtt"]),
    "Game Dev":       ("concept", ["game development", "unity", "unreal", "godot"]),
}


def get_all_tech_names() -> List[str]:
    """Return all canonical technology names."""
    return list(TECH_DIRECTORY.keys())


def match_technologies(text: str) -> List[Dict]:
    """
    Scan text against the full tech directory using word-boundary matching.
    Returns list of {"name": ..., "category": ..., "confidence": ...}
    """
    import re

    text_lower = text.lower()
    found: Dict[str, str] = {}  # canonical name -> category

    # Aliases that are too short or ambiguous for word-boundary matching.
    # These need extra context (e.g., "go" alone would match too much).
    _SKIP_STANDALONE = {"go", "r", "c", "dart", "gin ", "lua", "koa", "ts", "js", "py", "rb", "sh"}

    for canonical, (category, aliases) in TECH_DIRECTORY.items():
        if canonical in found:
            continue
        for alias in aliases:
            # Skip very short/ambiguous aliases
            if alias.strip() in _SKIP_STANDALONE:
                continue

            # For file extensions like .tsx, .ts, .py — match literally
            if alias.startswith("."):
                if alias in text_lower:
                    found[canonical] = category
                    break
                continue

            # Use word-boundary regex to avoid partial matches
            # e.g., "java" won't match inside "javascript"
            try:
                pattern = r'\b' + re.escape(alias.strip()) + r'\b'
                if re.search(pattern, text_lower):
                    found[canonical] = category
                    break
            except re.error:
                # Fallback to simple match for weird patterns
                if alias in text_lower:
                    found[canonical] = category
                    break

    return [
        {"name": name, "category": cat, "confidence": 0.7}
        for name, cat in found.items()
    ]


# Canonical inter-technology relationships: (tech_A, tech_B, relation_type, strength)
TECH_RELATIONSHIPS: List[Tuple[str, str, str, float]] = [
    # Frontend ecosystem
    ("Next.js", "React", "EXTENDS", 0.95),
    ("Framer Motion", "React", "INTEGRATES_WITH", 0.85),
    ("shadcn/ui", "React", "BUILT_ON", 0.85),
    ("React", "JavaScript", "WRITTEN_IN", 0.90),
    ("React", "TypeScript", "TYPED_WITH", 0.90),
    ("TypeScript", "JavaScript", "SUPERSET_OF", 0.95),
    ("Vite", "JavaScript", "BUNDLES", 0.80),
    ("Three.js", "JavaScript", "WRITTEN_IN", 0.85),
    ("D3.js", "JavaScript", "WRITTEN_IN", 0.85),
    ("Tailwind CSS", "CSS", "EXTENDS", 0.90),
    ("CSS", "HTML", "STYLES", 0.85),
    ("SCSS", "CSS", "SUPERSET_OF", 0.90),
    ("Bootstrap", "CSS", "FRAMEWORK_FOR", 0.80),
    ("Vue.js", "JavaScript", "WRITTEN_IN", 0.90),
    ("Angular", "TypeScript", "WRITTEN_IN", 0.90),
    ("Svelte", "JavaScript", "WRITTEN_IN", 0.90),
    ("Responsive Design", "CSS", "APPLIED_TO", 0.85),
    ("PWA", "JavaScript", "IMPLEMENTED_WITH", 0.80),
    ("Accessibility", "HTML", "STANDARD_FOR", 0.80),

    # Backend ecosystem
    ("FastAPI", "Python", "WRITTEN_IN", 0.95),
    ("Flask", "Python", "WRITTEN_IN", 0.90),
    ("Django", "Python", "WRITTEN_IN", 0.95),
    ("Express.js", "Node.js", "RUNS_ON", 0.95),
    ("Express", "Node.js", "RUNS_ON", 0.95),
    ("Passport.js", "Node.js", "AUTH_FOR", 0.85),
    ("Passport.js", "Authentication", "IMPLEMENTS", 0.90),
    ("Firebase Auth", "Authentication", "PROVIDES", 0.95),
    ("REST API", "HTTPS", "PROTOCOL", 0.80),
    ("WebSocket", "Real-time", "ENABLES", 0.95),
    ("Node.js", "JavaScript", "RUNTIME_FOR", 0.95),

    # ML & AI ecosystem
    ("Pandas", "NumPy", "DEPENDS_ON", 0.90),
    ("Pandas", "Python", "WRITTEN_IN", 0.90),
    ("NumPy", "Python", "WRITTEN_IN", 0.95),
    ("Matplotlib", "NumPy", "DEPENDS_ON", 0.85),
    ("Plotly", "Pandas", "VISUALIZES", 0.85),
    ("Keras", "TensorFlow", "HIGH_LEVEL_API", 0.95),
    ("TensorFlow", "Python", "BINDINGS_FOR", 0.90),
    ("PyTorch", "Python", "WRITTEN_IN", 0.95),
    ("scikit-learn", "NumPy", "DEPENDS_ON", 0.90),
    ("Streamlit", "Python", "FRAMEWORK_FOR", 0.90),
    ("LangChain", "LLM", "ORCHESTRATES", 0.90),
    ("Gemini", "LLM", "INSTANCE_OF", 0.90),
    ("Claude", "LLM", "INSTANCE_OF", 0.90),
    ("OpenCV", "Image Processing", "IMPLEMENTS", 0.90),
    ("NLP", "Machine Learning", "SUBFIELD_OF", 0.90),
    ("Jupyter", "Python", "INTERACTIVE_SHELL", 0.85),
    ("Jupyter Notebook", "Python", "FORMAT_FOR", 0.85),

    # DevOps & Infrastructure
    ("GitHub Actions", "GitHub", "CI_CD_ON", 0.95),
    ("GitHub Actions", "Git", "AUTOMATES", 0.90),
    ("Docker", "Linux", "CONTAINERIZES", 0.90),
    ("Docker Compose", "Docker", "ORCHESTRATES", 0.95),
    ("PowerShell", "Shell", "ALTERNATIVE_TO", 0.80),
    ("Terraform", "DevOps", "IAC_FOR", 0.90),
    ("Git", "GitHub", "REMOTES_TO", 0.95),

    # Mobile ecosystem
    ("Flutter", "Dart", "WRITTEN_IN", 0.95),
    ("Android", "Kotlin", "PRIMARY_LANG", 0.90),
    ("iOS", "Swift", "PRIMARY_LANG", 0.90),

    # Database ecosystem
    ("PostgreSQL", "SQL", "DIALECT_OF", 0.95),
    ("MySQL", "SQL", "DIALECT_OF", 0.95),
    ("Redis", "Caching", "IMPLEMENTS", 0.90),
    ("Pinecone", "Database", "VECTOR_DB", 0.85),
]


def infer_tech_relationships(nodes: List[Dict], existing_links: List[Dict]) -> List[Dict]:
    """
    Given a list of nodes and links, identify known technology relationships
    where both technologies are present in nodes, and return the new links.
    """
    node_by_name: Dict[str, Dict] = {}
    for n in nodes:
        node_by_name[n.get("name", "").lower()] = n
        node_by_name[n.get("id", "").lower()] = n

    existing_pairs = set()
    for l in existing_links:
        s = l.get("source")
        t = l.get("target")
        s_id = s.get("id") if isinstance(s, dict) else str(s)
        t_id = t.get("id") if isinstance(t, dict) else str(t)
        existing_pairs.add((s_id, t_id))
        existing_pairs.add((t_id, s_id))

    new_links: List[Dict] = []
    for src_name, tgt_name, rel_type, strength in TECH_RELATIONSHIPS:
        s_node = node_by_name.get(src_name.lower())
        t_node = node_by_name.get(tgt_name.lower())
        if s_node and t_node and s_node["id"] != t_node["id"]:
            pair = (s_node["id"], t_node["id"])
            if pair not in existing_pairs:
                link = {
                    "source": s_node["id"],
                    "target": t_node["id"],
                    "type": rel_type,
                    "strength": strength,
                }
                new_links.append(link)
                existing_pairs.add(pair)
                existing_pairs.add((t_node["id"], s_node["id"]))

    return new_links

