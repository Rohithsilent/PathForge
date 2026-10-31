// Shared technology metadata: human-friendly descriptions, official learning
// sources, logo assets and roadmap.sh links. Used by the 3D graph, insight
// panel and roadmap panel so every surface tells the same story.

export type LearningCurve = "Beginner-friendly" | "Moderate" | "Advanced"

export interface TechMeta {
    label: string
    description: string
    docsUrl: string
    docsLabel: string
    /** Where this technology is actually used, in plain language. */
    usedFor: string
    /** Honest difficulty signal for someone starting from zero. */
    difficulty: LearningCurve
    /** Technologies that are commonly learned alongside it. */
    pairsWith: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
    frontend: "frontend technology",
    backend: "backend technology",
    database: "database technology",
    devops: "DevOps tool",
    ml: "machine learning technology",
    concept: "concept",
    cert: "certification",
    repo: "repository",
    mobile: "mobile technology",
    language: "programming language",
}

// Normalise a node id ("nextjs", "tailwind-css") or a display name
// ("Next.js", "Tailwind CSS") to a single lookup key.
export function techKey(value: string | undefined | null): string {
    if (!value) return ""
    // Handle identifiers whose punctuation is meaningful before stripping it.
    const raw = value.trim().toLowerCase().replace(/\s+/g, "")
    if (raw === "c++" || raw === "cpp" || raw === "cplusplus") return "cplusplus"
    if (raw === "c#" || raw === "csharp" || raw === ".net" || raw === "dotnet") return "csharp"

    const key = raw.replace(/[._/+-]+/g, "")
    const aliases: Record<string, string> = {
        node: "nodejs",
        nodedotjs: "nodejs",
        reactjs: "react",
        next: "nextjs",
        nextdotjs: "nextjs",
        vuedotjs: "vuejs",
        vue: "vuejs",
        angularjs: "angular",
        expressjs: "express",
        threedotjs: "threejs",
        chartdotjs: "chartjs",
        d3dotjs: "d3js",
        python3: "python",
        py: "python",
        ts: "typescript",
        js: "javascript",
        es6: "javascript",
        golang: "go",
        rustlang: "rust",
        kt: "kotlin",
        rb: "ruby",
        scss: "sass",
        tailwind: "tailwindcss",
        mui: "materialui",
        postgres: "postgresql",
        psql: "postgresql",
        mongo: "mongodb",
        sklearn: "scikitlearn",
        sklean: "scikitlearn",
        hf: "huggingface",
        openaiapi: "openai",
        rest: "restapi",
        sysdesign: "systemdesign",
        mlroadmap: "mlroadmap",
        metafrontend: "metacert",
    }
    return aliases[key] || key
}

// ── Logos ────────────────────────────────────────────────────────────────
// Local SVGs under /public/icons. Anything not listed here falls back to a
// category glyph so every node still gets a recognisable badge.
export const TECH_ICONS: Record<string, string> = {
    // Languages
    javascript: "/icons/javascript.svg",
    typescript: "/icons/typescript.svg",
    python: "/icons/python.svg",
    java: "/icons/openjdk.svg",
    kotlin: "/icons/kotlin.svg",
    swift: "/icons/swift.svg",
    cplusplus: "/icons/cplusplus.svg",
    csharp: "/icons/dotnet.svg",
    c: "/icons/c.svg",
    go: "/icons/go.svg",
    rust: "/icons/rust.svg",
    ruby: "/icons/ruby.svg",
    php: "/icons/php.svg",
    dart: "/icons/dart.svg",
    bash: "/icons/gnubash.svg",
    shell: "/icons/shell.svg",
    // Frontend
    react: "/icons/react.svg",
    html: "/icons/html5.svg",
    css: "/icons/css3.svg",
    sass: "/icons/sass.svg",
    nextjs: "/icons/nextdotjs.svg",
    vuejs: "/icons/vuedotjs.svg",
    angular: "/icons/angular.svg",
    svelte: "/icons/svelte.svg",
    astro: "/icons/astro.svg",
    tailwindcss: "/icons/tailwindcss.svg",
    bootstrap: "/icons/bootstrap.svg",
    webpack: "/icons/webpack.svg",
    vite: "/icons/vite.svg",
    threejs: "/icons/threedotjs.svg",
    d3js: "/icons/d3.svg",
    chartjs: "/icons/chartdotjs.svg",
    framermotion: "/icons/framer.svg",
    gsap: "/icons/greensock.svg",
    redux: "/icons/redux.svg",
    // Backend
    nodejs: "/icons/nodejs.svg",
    express: "/icons/express.svg",
    fastapi: "/icons/fastapi.svg",
    django: "/icons/django.svg",
    flask: "/icons/flask.svg",
    pydantic: "/icons/pydantic.svg",
    sqlalchemy: "/icons/sqlalchemy.svg",
    graphql: "/icons/graphql.svg",
    socketio: "/icons/socketdotio.svg",
    // Databases
    mongodb: "/icons/mongodb.svg",
    postgresql: "/icons/postgresql.svg",
    mysql: "/icons/mysql.svg",
    redis: "/icons/redis.svg",
    sqlite: "/icons/sqlite.svg",
    prisma: "/icons/prisma.svg",
    supabase: "/icons/supabase.svg",
    firebase: "/icons/firebase.svg",
    // ML / data
    numpy: "/icons/numpy.svg",
    pandas: "/icons/pandas.svg",
    jupyter: "/icons/jupyter.svg",
    pytorch: "/icons/pytorch.svg",
    tensorflow: "/icons/tensorflow.svg",
    keras: "/icons/keras.svg",
    scikitlearn: "/icons/scikitlearn.svg",
    huggingface: "/icons/huggingface.svg",
    langchain: "/icons/langchain.svg",
    opencv: "/icons/opencv.svg",
    plotly: "/icons/plotly.svg",
    streamlit: "/icons/streamlit.svg",
    gradio: "/icons/gradio.svg",
    selenium: "/icons/selenium.svg",
    ollama: "/icons/ollama.svg",
    // DevOps / tooling
    git: "/icons/git.svg",
    github: "/icons/github.svg",
    gitlab: "/icons/gitlab.svg",
    docker: "/icons/docker.svg",
    kubernetes: "/icons/kubernetes.svg",
    linux: "/icons/linux.svg",
    nginx: "/icons/nginx.svg",
    terraform: "/icons/terraform.svg",
    jenkins: "/icons/jenkins.svg",
    vercel: "/icons/vercel.svg",
    npm: "/icons/npm.svg",
    yarn: "/icons/yarn.svg",
    pnpm: "/icons/pnpm.svg",
    jest: "/icons/jest.svg",
    vitest: "/icons/vitest.svg",
    cypress: "/icons/cypress.svg",
    stripe: "/icons/stripe.svg",
    electron: "/icons/electron.svg",
    reactnative: "/icons/react.svg",
    flutter: "/icons/flutter.svg",
    android: "/icons/android.svg",
    gcp: "/icons/googlecloud.svg",
}

const REPO_ICON = "/icons/github.svg"

export function getTechIcon(id: string, name?: string): string | null {
    if (id?.startsWith("repo:")) return REPO_ICON
    return TECH_ICONS[techKey(id)] || TECH_ICONS[techKey(name || "")] || null
}

const CATEGORY_GLYPHS: Record<string, string> = {
    repo: "📦",
    frontend: "🎨",
    backend: "⚙️",
    database: "🗄️",
    devops: "🛠️",
    ml: "🧠",
    concept: "💡",
    cert: "🏅",
    mobile: "📱",
    language: "{ }",
}

export function getCategoryGlyph(category: string): string {
    return CATEGORY_GLYPHS[category] || "◆"
}

// ── Plain-language "what is this for" extras ─────────────────────────────
// Curated for the technologies a beginner is most likely to click on. The
// category fallbacks below keep every other node equally useful.
interface TechExtra {
    usedFor: string
    difficulty: LearningCurve
    pairsWith: string[]
}

const TECH_EXTRAS: Record<string, TechExtra> = {
    // Languages
    javascript: {
        usedFor: "Making websites interactive and powering JavaScript servers.",
        difficulty: "Beginner-friendly",
        pairsWith: ["HTML", "CSS", "React", "Node.js"],
    },
    typescript: {
        usedFor: "Adding type safety so large JavaScript projects break less.",
        difficulty: "Moderate",
        pairsWith: ["JavaScript", "React", "Next.js", "Node.js"],
    },
    python: {
        usedFor: "Backend APIs, automation, data analysis and machine learning.",
        difficulty: "Beginner-friendly",
        pairsWith: ["FastAPI", "NumPy", "pandas", "Jupyter"],
    },
    sql: {
        usedFor: "Asking questions of data stored in relational databases.",
        difficulty: "Beginner-friendly",
        pairsWith: ["PostgreSQL", "MySQL", "Python", "Analytics"],
    },
    java: {
        usedFor: "Enterprise backends and Android apps.",
        difficulty: "Moderate",
        pairsWith: ["Spring Boot", "Android", "SQL", "Git"],
    },
    go: {
        usedFor: "Fast, reliable services and cloud infrastructure tooling.",
        difficulty: "Moderate",
        pairsWith: ["Docker", "Kubernetes", "Linux", "APIs"],
    },
    rust: {
        usedFor: "High-performance systems and memory-safe tooling.",
        difficulty: "Advanced",
        pairsWith: ["C++", "Linux", "WebAssembly", "CLI tools"],
    },

    // Frontend
    react: {
        usedFor: "Building interactive, component-based web interfaces.",
        difficulty: "Moderate",
        pairsWith: ["JavaScript", "CSS", "Next.js", "TypeScript"],
    },
    html: {
        usedFor: "Structuring the content of every web page.",
        difficulty: "Beginner-friendly",
        pairsWith: ["CSS", "JavaScript", "React", "Git"],
    },
    css: {
        usedFor: "Controlling layout, colour, typography and responsive design.",
        difficulty: "Beginner-friendly",
        pairsWith: ["HTML", "JavaScript", "Tailwind CSS", "React"],
    },
    nextjs: {
        usedFor: "Production React apps with routing, server rendering and APIs.",
        difficulty: "Moderate",
        pairsWith: ["React", "TypeScript", "Tailwind CSS", "Vercel"],
    },
    tailwindcss: {
        usedFor: "Styling interfaces quickly with utility classes in your markup.",
        difficulty: "Beginner-friendly",
        pairsWith: ["HTML", "CSS", "React", "Next.js"],
    },
    vuejs: {
        usedFor: "Building approachable, reactive web interfaces.",
        difficulty: "Beginner-friendly",
        pairsWith: ["JavaScript", "HTML", "CSS", "Vite"],
    },
    threejs: {
        usedFor: "Rendering 3D scenes and interactive visuals in the browser.",
        difficulty: "Advanced",
        pairsWith: ["JavaScript", "React", "WebGL", "GSAP"],
    },

    // Backend
    nodejs: {
        usedFor: "Running JavaScript on the server to build APIs and real-time apps.",
        difficulty: "Moderate",
        pairsWith: ["JavaScript", "Express", "MongoDB", "npm"],
    },
    express: {
        usedFor: "Creating lightweight REST APIs and web servers with Node.js.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Node.js", "JavaScript", "MongoDB", "REST APIs"],
    },
    fastapi: {
        usedFor: "Building fast, typed Python APIs with automatic documentation.",
        difficulty: "Moderate",
        pairsWith: ["Python", "SQLAlchemy", "Pydantic", "Docker"],
    },
    django: {
        usedFor: "Full-featured Python web apps with an ORM and admin panel.",
        difficulty: "Moderate",
        pairsWith: ["Python", "PostgreSQL", "HTML", "Docker"],
    },
    restapi: {
        usedFor: "Designing predictable HTTP endpoints that apps can talk to.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Express", "FastAPI", "JSON", "Postman"],
    },
    graphql: {
        usedFor: "Letting clients request exactly the data they need from an API.",
        difficulty: "Advanced",
        pairsWith: ["Node.js", "React", "Apollo", "TypeScript"],
    },

    // Databases
    mongodb: {
        usedFor: "Storing flexible, JSON-like documents for web apps.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Node.js", "Express", "Mongoose", "JavaScript"],
    },
    postgresql: {
        usedFor: "Reliable relational storage for serious applications.",
        difficulty: "Moderate",
        pairsWith: ["SQL", "Python", "Node.js", "Docker"],
    },
    redis: {
        usedFor: "Caching, sessions and queues where speed matters.",
        difficulty: "Moderate",
        pairsWith: ["Node.js", "Python", "Docker", "Backend APIs"],
    },

    // ML / data
    numpy: {
        usedFor: "Fast numerical computing — the base layer of most ML libraries.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Python", "pandas", "scikit-learn", "Jupyter"],
    },
    pandas: {
        usedFor: "Cleaning, transforming and exploring tabular data.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Python", "NumPy", "Jupyter", "SQL"],
    },
    jupyter: {
        usedFor: "Exploring data and prototyping ML in shareable notebooks.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Python", "NumPy", "pandas", "Matplotlib"],
    },
    pytorch: {
        usedFor: "Training deep learning models for research and production.",
        difficulty: "Advanced",
        pairsWith: ["Python", "NumPy", "CUDA", "Hugging Face"],
    },
    tensorflow: {
        usedFor: "Training and deploying machine learning models at scale.",
        difficulty: "Advanced",
        pairsWith: ["Python", "Keras", "NumPy", "Docker"],
    },
    scikitlearn: {
        usedFor: "Classic ML: regression, classification and clustering.",
        difficulty: "Moderate",
        pairsWith: ["Python", "pandas", "NumPy", "Jupyter"],
    },
    huggingface: {
        usedFor: "Using pre-trained AI models without training from scratch.",
        difficulty: "Moderate",
        pairsWith: ["Python", "PyTorch", "Transformers", "FastAPI"],
    },
    langchain: {
        usedFor: "Building LLM-powered apps with tools, memory and retrieval.",
        difficulty: "Moderate",
        pairsWith: ["Python", "OpenAI API", "Vector databases", "FastAPI"],
    },
    openai: {
        usedFor: "Adding GPT, embedding and multimodal AI features to an app.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Python", "JavaScript", "LangChain", "FastAPI"],
    },

    // DevOps / tooling
    git: {
        usedFor: "Tracking changes and collaborating without losing your work.",
        difficulty: "Beginner-friendly",
        pairsWith: ["GitHub", "VS Code", "Terminal", "Any language"],
    },
    github: {
        usedFor: "Hosting code, collaborating and showing your work to employers.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Git", "README", "GitHub Actions", "Open source"],
    },
    docker: {
        usedFor: "Packaging apps so they run the same on every machine.",
        difficulty: "Moderate",
        pairsWith: ["Linux", "Kubernetes", "FastAPI", "PostgreSQL"],
    },
    kubernetes: {
        usedFor: "Running and scaling containers across many servers.",
        difficulty: "Advanced",
        pairsWith: ["Docker", "Linux", "Cloud", "CI/CD"],
    },
    linux: {
        usedFor: "Working comfortably with the servers most software runs on.",
        difficulty: "Moderate",
        pairsWith: ["Bash", "Git", "Docker", "Networking"],
    },
    vercel: {
        usedFor: "Deploying frontend and Next.js apps with zero server setup.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Next.js", "React", "GitHub", "Tailwind CSS"],
    },

    // Concepts & certifications
    systemdesign: {
        usedFor: "Designing apps that stay fast and reliable as they grow.",
        difficulty: "Advanced",
        pairsWith: ["Databases", "Caching", "APIs", "Cloud"],
    },
    mlroadmap: {
        usedFor: "A step-by-step path from Python basics to AI engineering.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Python", "NumPy", "PyTorch", "scikit-learn"],
    },
    metacert: {
        usedFor: "A structured, resume-ready credential for frontend roles.",
        difficulty: "Beginner-friendly",
        pairsWith: ["React", "JavaScript", "CSS", "Portfolio projects"],
    },
}

const CATEGORY_EXTRAS: Record<string, TechExtra> = {
    frontend: {
        usedFor: "Building the part of a website or app that people see and use.",
        difficulty: "Beginner-friendly",
        pairsWith: ["HTML", "CSS", "JavaScript", "Git"],
    },
    backend: {
        usedFor: "Powering the server side — APIs, business logic and data.",
        difficulty: "Moderate",
        pairsWith: ["Python", "Node.js", "SQL", "Docker"],
    },
    database: {
        usedFor: "Storing, querying and organising an app's data.",
        difficulty: "Moderate",
        pairsWith: ["SQL", "Python", "Node.js", "Docker"],
    },
    devops: {
        usedFor: "Shipping, running and maintaining software reliably.",
        difficulty: "Moderate",
        pairsWith: ["Git", "Docker", "Linux", "CI/CD"],
    },
    ml: {
        usedFor: "Building models that learn patterns from data.",
        difficulty: "Advanced",
        pairsWith: ["Python", "NumPy", "pandas", "Jupyter"],
    },
    concept: {
        usedFor: "A core idea you'll reuse across projects and interviews.",
        difficulty: "Moderate",
        pairsWith: ["Git", "SQL", "Docker", "System Design"],
    },
    cert: {
        usedFor: "A structured credential that proves job-ready skills.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Git", "GitHub", "Portfolio projects", "Interview prep"],
    },
    mobile: {
        usedFor: "Building apps that run on phones and tablets.",
        difficulty: "Moderate",
        pairsWith: ["Dart", "Kotlin", "Swift", "REST APIs"],
    },
    language: {
        usedFor: "Writing the logic behind websites, apps and software.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Git", "VS Code", "Terminal", "Problem solving"],
    },
    repo: {
        usedFor: "One of your own projects — proof of what you can actually build.",
        difficulty: "Beginner-friendly",
        pairsWith: ["Git", "GitHub", "README", "Deployment"],
    },
}

const DEFAULT_EXTRAS: TechExtra = {
    usedFor: "A technology detected in your connected repositories.",
    difficulty: "Moderate",
    pairsWith: ["Git", "GitHub", "Documentation", "Practice projects"],
}

// ── Descriptions & learning sources ──────────────────────────────────────
const TECH_META: Record<string, Omit<TechMeta, "label" | "usedFor" | "difficulty" | "pairsWith">> = {
    // Languages
    javascript: {
        description: "The language of the web. JavaScript powers interactive interfaces, Node.js servers and everything in between.",
        docsUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        docsLabel: "MDN JavaScript Guide",
    },
    typescript: {
        description: "A typed superset of JavaScript that catches bugs at compile time and scales large codebases.",
        docsUrl: "https://www.typescriptlang.org/docs/handbook/intro.html",
        docsLabel: "TypeScript Handbook",
    },
    python: {
        description: "A readable, general-purpose language that dominates data science, automation and backend APIs.",
        docsUrl: "https://docs.python.org/3/tutorial/",
        docsLabel: "Official Python Tutorial",
    },
    java: {
        description: "A mature, strongly typed language behind enterprise systems, Android apps and large-scale services.",
        docsUrl: "https://dev.java/learn/",
        docsLabel: "dev.java Learning Path",
    },
    kotlin: {
        description: "A concise JVM language that is the modern default for Android development.",
        docsUrl: "https://kotlinlang.org/docs/home.html",
        docsLabel: "Kotlin Documentation",
    },
    swift: {
        description: "Apple's language for building iOS, macOS, watchOS and visionOS apps.",
        docsUrl: "https://www.swift.org/documentation/",
        docsLabel: "Swift Documentation",
    },
    cplusplus: {
        description: "A high-performance systems language used in game engines, embedded systems and performance-critical software.",
        docsUrl: "https://en.cppreference.com/w/cpp",
        docsLabel: "C++ Reference",
    },
    csharp: {
        description: "Microsoft's modern object-oriented language for .NET, desktop, web and game development.",
        docsUrl: "https://learn.microsoft.com/en-us/dotnet/csharp/",
        docsLabel: "C# Learning Path",
    },
    c: {
        description: "The foundational systems language behind operating systems, compilers and embedded devices.",
        docsUrl: "https://en.cppreference.com/w/c",
        docsLabel: "C Reference",
    },
    go: {
        description: "A simple, fast compiled language built by Google for reliable networked services and cloud tooling.",
        docsUrl: "https://go.dev/tour/",
        docsLabel: "A Tour of Go",
    },
    rust: {
        description: "A memory-safe systems language with zero-cost abstractions, loved for performance-critical and embedded work.",
        docsUrl: "https://doc.rust-lang.org/book/",
        docsLabel: "The Rust Book",
    },
    ruby: {
        description: "A developer-friendly language best known for the Ruby on Rails web framework.",
        docsUrl: "https://www.ruby-lang.org/en/documentation/quickstart/",
        docsLabel: "Ruby in 20 Minutes",
    },
    php: {
        description: "A server-side language that still powers a large share of the web, especially with Laravel.",
        docsUrl: "https://www.php.net/manual/en/tutorial.php",
        docsLabel: "PHP Tutorial",
    },
    dart: {
        description: "The language behind Flutter, used to build cross-platform mobile and web apps.",
        docsUrl: "https://dart.dev/language",
        docsLabel: "Dart Language Tour",
    },
    bash: {
        description: "The default Unix shell for scripting, automation and glue code on servers.",
        docsUrl: "https://www.gnu.org/software/bash/manual/",
        docsLabel: "GNU Bash Manual",
    },
    powershell: {
        description: "Microsoft's automation and configuration shell for Windows and cross-platform administration.",
        docsUrl: "https://learn.microsoft.com/en-us/powershell/",
        docsLabel: "PowerShell Documentation",
    },
    sql: {
        description: "The standard query language for relational databases. Essential for almost every data-heavy role.",
        docsUrl: "https://sqlbolt.com/",
        docsLabel: "SQLBolt Interactive Lessons",
    },

    // Frontend
    react: {
        description: "A component-based UI library for building interactive web interfaces. The most widely used frontend library in job listings.",
        docsUrl: "https://react.dev/learn",
        docsLabel: "Official React Tutorial",
    },
    html: {
        description: "The markup language that structures every page on the web.",
        docsUrl: "https://developer.mozilla.org/en-US/docs/Learn/HTML",
        docsLabel: "MDN HTML Learning Path",
    },
    css: {
        description: "The styling language that controls layout, typography and visual design on the web.",
        docsUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS",
        docsLabel: "MDN CSS Learning Path",
    },
    nextjs: {
        description: "A React framework for production apps with routing, server rendering and API routes built in.",
        docsUrl: "https://nextjs.org/learn",
        docsLabel: "Next.js Learn Course",
    },
    vuejs: {
        description: "A progressive frontend framework known for approachable syntax and excellent developer experience.",
        docsUrl: "https://vuejs.org/guide/introduction.html",
        docsLabel: "Vue.js Guide",
    },
    angular: {
        description: "Google's full-featured TypeScript framework for large enterprise web applications.",
        docsUrl: "https://angular.dev/tutorials",
        docsLabel: "Angular Tutorials",
    },
    svelte: {
        description: "A compiler-first frontend framework that turns components into highly optimised vanilla JavaScript.",
        docsUrl: "https://svelte.dev/tutorial",
        docsLabel: "Svelte Tutorial",
    },
    astro: {
        description: "A content-focused framework that ships zero JavaScript by default and supports islands of interactivity.",
        docsUrl: "https://docs.astro.build/en/tutorial/0-introduction/",
        docsLabel: "Astro Tutorial",
    },
    tailwindcss: {
        description: "A utility-first CSS framework for rapidly building custom interfaces directly in markup.",
        docsUrl: "https://tailwindcss.com/docs/utility-first",
        docsLabel: "Tailwind CSS Docs",
    },
    bootstrap: {
        description: "A classic component and grid framework for quickly building responsive sites.",
        docsUrl: "https://getbootstrap.com/docs/5.3/getting-started/introduction/",
        docsLabel: "Bootstrap Docs",
    },
    sass: {
        description: "A CSS preprocessor adding variables, nesting and mixins for maintainable stylesheets.",
        docsUrl: "https://sass-lang.com/guide/",
        docsLabel: "Sass Guide",
    },
    webpack: {
        description: "A powerful module bundler for JavaScript apps and assets.",
        docsUrl: "https://webpack.js.org/guides/getting-started/",
        docsLabel: "Webpack Getting Started",
    },
    vite: {
        description: "A fast build tool and dev server that has become the modern default for frontend projects.",
        docsUrl: "https://vite.dev/guide/",
        docsLabel: "Vite Guide",
    },
    threejs: {
        description: "A JavaScript library for rendering 3D scenes in the browser with WebGL.",
        docsUrl: "https://threejs.org/manual/",
        docsLabel: "Three.js Manual",
    },
    d3js: {
        description: "A low-level data visualization library for building custom charts with SVG and Canvas.",
        docsUrl: "https://d3js.org/getting-started",
        docsLabel: "D3 Getting Started",
    },
    chartjs: {
        description: "A simple, flexible JavaScript charting library for dashboards and reports.",
        docsUrl: "https://www.chartjs.org/docs/latest/",
        docsLabel: "Chart.js Documentation",
    },
    framermotion: {
        description: "A production-ready animation library for React interfaces and gestures.",
        docsUrl: "https://motion.dev/docs/react",
        docsLabel: "Motion for React Docs",
    },
    gsap: {
        description: "A high-performance animation platform for web timelines, scroll effects and SVG.",
        docsUrl: "https://gsap.com/docs/v3/",
        docsLabel: "GSAP Documentation",
    },
    redux: {
        description: "A predictable state container commonly paired with React for complex app state.",
        docsUrl: "https://redux.js.org/tutorials/essentials/overview",
        docsLabel: "Redux Essentials",
    },

    // Backend
    nodejs: {
        description: "A JavaScript runtime for building scalable network services and APIs outside the browser.",
        docsUrl: "https://nodejs.org/en/learn",
        docsLabel: "Node.js Learn",
    },
    express: {
        description: "A minimal, unopinionated Node.js web framework for REST APIs and web servers.",
        docsUrl: "https://expressjs.com/en/starter/installing.html",
        docsLabel: "Express Getting Started",
    },
    fastapi: {
        description: "A modern Python framework for typed, high-performance APIs with automatic OpenAPI docs.",
        docsUrl: "https://fastapi.tiangolo.com/tutorial/",
        docsLabel: "FastAPI Tutorial",
    },
    django: {
        description: "A batteries-included Python web framework with an ORM, admin panel and strong conventions.",
        docsUrl: "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
        docsLabel: "Django Tutorial",
    },
    flask: {
        description: "A lightweight Python micro-framework for small services and prototypes.",
        docsUrl: "https://flask.palletsprojects.com/en/stable/tutorial/",
        docsLabel: "Flask Tutorial",
    },
    pydantic: {
        description: "Python's most popular data validation library, powering FastAPI request and response models.",
        docsUrl: "https://docs.pydantic.dev/latest/",
        docsLabel: "Pydantic Docs",
    },
    sqlalchemy: {
        description: "A powerful Python ORM and SQL toolkit used with FastAPI, Flask and Django projects.",
        docsUrl: "https://docs.sqlalchemy.org/en/20/tutorial/",
        docsLabel: "SQLAlchemy Tutorial",
    },
    graphql: {
        description: "A typed query language and runtime for APIs that lets clients request exactly the data they need.",
        docsUrl: "https://graphql.org/learn/",
        docsLabel: "GraphQL Learn",
    },
    socketio: {
        description: "A library for real-time, bidirectional communication between clients and servers.",
        docsUrl: "https://socket.io/docs/v4/tutorial/introduction",
        docsLabel: "Socket.io Tutorial",
    },
    restapi: {
        description: "A design style for HTTP APIs built around resources, verbs and stateless requests.",
        docsUrl: "https://restfulapi.net/",
        docsLabel: "REST API Tutorial",
    },

    // Databases
    mongodb: {
        description: "A document database storing flexible JSON-like records, popular in the Node.js ecosystem.",
        docsUrl: "https://learn.mongodb.com/",
        docsLabel: "MongoDB Learn",
    },
    postgresql: {
        description: "A robust open-source relational database with advanced SQL, JSON and extension support.",
        docsUrl: "https://www.postgresql.org/docs/current/tutorial.html",
        docsLabel: "PostgreSQL Tutorial",
    },
    mysql: {
        description: "The most widely deployed open-source relational database for web applications.",
        docsUrl: "https://dev.mysql.com/doc/mysql-tutorial-excerpt/en/",
        docsLabel: "MySQL Tutorial",
    },
    redis: {
        description: "An in-memory key-value store used for caching, queues, sessions and real-time features.",
        docsUrl: "https://redis.io/learn",
        docsLabel: "Redis Learn",
    },
    sqlite: {
        description: "A serverless, file-based SQL database embedded in apps and prototypes.",
        docsUrl: "https://www.sqlite.org/docs.html",
        docsLabel: "SQLite Docs",
    },
    prisma: {
        description: "A type-safe ORM for Node.js and TypeScript with schema-driven migrations.",
        docsUrl: "https://www.prisma.io/docs",
        docsLabel: "Prisma Docs",
    },
    supabase: {
        description: "An open-source Firebase alternative offering Postgres, auth, storage and realtime APIs.",
        docsUrl: "https://supabase.com/docs",
        docsLabel: "Supabase Docs",
    },
    firebase: {
        description: "Google's backend platform for auth, databases, storage and app hosting.",
        docsUrl: "https://firebase.google.com/docs",
        docsLabel: "Firebase Docs",
    },
    mongoose: {
        description: "An elegant MongoDB object modelling layer for Node.js.",
        docsUrl: "https://mongoosejs.com/docs/",
        docsLabel: "Mongoose Docs",
    },

    // ML / data
    numpy: {
        description: "The foundational Python library for numerical arrays and scientific computing.",
        docsUrl: "https://numpy.org/learn/",
        docsLabel: "NumPy Learn",
    },
    pandas: {
        description: "Python's data analysis toolkit for cleaning, transforming and exploring tabular data.",
        docsUrl: "https://pandas.pydata.org/docs/getting_started/",
        docsLabel: "Pandas Getting Started",
    },
    jupyter: {
        description: "Interactive notebooks for exploratory data analysis, ML experiments and sharing results.",
        docsUrl: "https://jupyter.org/documentation",
        docsLabel: "Jupyter Documentation",
    },
    pytorch: {
        description: "Meta's deep learning framework, the standard for research and increasingly for production ML.",
        docsUrl: "https://pytorch.org/tutorials/",
        docsLabel: "PyTorch Tutorials",
    },
    tensorflow: {
        description: "Google's end-to-end machine learning platform for training and deploying models at scale.",
        docsUrl: "https://www.tensorflow.org/tutorials",
        docsLabel: "TensorFlow Tutorials",
    },
    keras: {
        description: "A high-level neural network API that runs on top of TensorFlow and JAX.",
        docsUrl: "https://keras.io/getting_started/",
        docsLabel: "Keras Getting Started",
    },
    scikitlearn: {
        description: "The go-to Python library for classical machine learning: regression, classification and clustering.",
        docsUrl: "https://scikit-learn.org/stable/getting_started.html",
        docsLabel: "scikit-learn Getting Started",
    },
    huggingface: {
        description: "The hub for open transformer models, datasets and libraries like Transformers and Diffusers.",
        docsUrl: "https://huggingface.co/learn",
        docsLabel: "Hugging Face Learn",
    },
    langchain: {
        description: "A framework for building LLM-powered applications with chains, tools and retrieval.",
        docsUrl: "https://python.langchain.com/docs/tutorials/",
        docsLabel: "LangChain Tutorials",
    },
    openai: {
        description: "The API platform behind GPT models, embeddings and multimodal AI features.",
        docsUrl: "https://platform.openai.com/docs/quickstart",
        docsLabel: "OpenAI API Quickstart",
    },
    opencv: {
        description: "The standard computer vision library for image processing and real-time video analysis.",
        docsUrl: "https://docs.opencv.org/4.x/d9/df8/tutorial_root.html",
        docsLabel: "OpenCV Tutorials",
    },
    matplotlib: {
        description: "Python's classic plotting library for publication-quality charts.",
        docsUrl: "https://matplotlib.org/stable/users/explain/quick_start.html",
        docsLabel: "Matplotlib Quick Start",
    },
    plotly: {
        description: "An interactive charting library for Python, R and JavaScript dashboards.",
        docsUrl: "https://plotly.com/python/getting-started/",
        docsLabel: "Plotly Getting Started",
    },
    streamlit: {
        description: "A fast way to turn Python data scripts into shareable web apps.",
        docsUrl: "https://docs.streamlit.io/get-started",
        docsLabel: "Streamlit Get Started",
    },
    gradio: {
        description: "A Python library for quickly building demos and UIs for ML models.",
        docsUrl: "https://www.gradio.app/guides/quickstart",
        docsLabel: "Gradio Quickstart",
    },
    selenium: {
        description: "A browser automation framework used for end-to-end testing and scraping.",
        docsUrl: "https://www.selenium.dev/documentation/webdriver/getting_started/",
        docsLabel: "Selenium Docs",
    },
    ollama: {
        description: "A local runtime for running open-weight LLMs on your own machine.",
        docsUrl: "https://docs.ollama.com/",
        docsLabel: "Ollama Docs",
    },

    // DevOps / tooling
    git: {
        description: "The distributed version control system that underpins almost all modern software work.",
        docsUrl: "https://git-scm.com/book/en/v2",
        docsLabel: "Pro Git Book",
    },
    github: {
        description: "The dominant platform for hosting code, collaborating and shipping software with CI/CD.",
        docsUrl: "https://docs.github.com/en/get-started",
        docsLabel: "GitHub Get Started",
    },
    docker: {
        description: "Containerisation platform that packages apps and dependencies into reproducible images.",
        docsUrl: "https://docs.docker.com/get-started/",
        docsLabel: "Docker Get Started",
    },
    kubernetes: {
        description: "The container orchestration standard for deploying, scaling and healing services.",
        docsUrl: "https://kubernetes.io/docs/tutorials/",
        docsLabel: "Kubernetes Tutorials",
    },
    linux: {
        description: "The open-source operating system kernel running most servers and cloud infrastructure.",
        docsUrl: "https://linuxjourney.com/",
        docsLabel: "Linux Journey",
    },
    nginx: {
        description: "A high-performance web server and reverse proxy used for serving apps and load balancing.",
        docsUrl: "https://nginx.org/en/docs/beginners_guide.html",
        docsLabel: "NGINX Beginner's Guide",
    },
    terraform: {
        description: "Infrastructure-as-code tool for provisioning cloud resources reproducibly.",
        docsUrl: "https://developer.hashicorp.com/terraform/tutorials",
        docsLabel: "Terraform Tutorials",
    },
    jenkins: {
        description: "A long-standing automation server for CI/CD pipelines.",
        docsUrl: "https://www.jenkins.io/doc/tutorials/",
        docsLabel: "Jenkins Tutorials",
    },
    vercel: {
        description: "A deployment platform optimised for Next.js and frontend projects.",
        docsUrl: "https://vercel.com/docs/getting-started-with-vercel",
        docsLabel: "Vercel Get Started",
    },
    npm: {
        description: "The default package manager for Node.js and the world's largest software registry.",
        docsUrl: "https://docs.npmjs.com/",
        docsLabel: "npm Docs",
    },
    yarn: {
        description: "A fast, reliable JavaScript package manager compatible with npm.",
        docsUrl: "https://yarnpkg.com/getting-started",
        docsLabel: "Yarn Getting Started",
    },
    pnpm: {
        description: "A disk-efficient JavaScript package manager using a content-addressable store.",
        docsUrl: "https://pnpm.io/motivation",
        docsLabel: "pnpm Docs",
    },
    jest: {
        description: "The most popular JavaScript testing framework, with a focus on React apps.",
        docsUrl: "https://jestjs.io/docs/getting-started",
        docsLabel: "Jest Getting Started",
    },
    vitest: {
        description: "A blazing-fast Vite-native unit testing framework.",
        docsUrl: "https://vitest.dev/guide/",
        docsLabel: "Vitest Guide",
    },
    cypress: {
        description: "A developer-friendly end-to-end testing tool that runs in the browser.",
        docsUrl: "https://docs.cypress.io/app/get-started/why-cypress",
        docsLabel: "Cypress Docs",
    },
    playwright: {
        description: "Microsoft's framework for reliable end-to-end testing across Chromium, Firefox and WebKit.",
        docsUrl: "https://playwright.dev/docs/intro",
        docsLabel: "Playwright Docs",
    },
    stripe: {
        description: "The payment infrastructure API used by most modern SaaS products.",
        docsUrl: "https://docs.stripe.com/get-started",
        docsLabel: "Stripe Get Started",
    },
    flutter: {
        description: "Google's cross-platform UI toolkit for building mobile, web and desktop apps from one codebase.",
        docsUrl: "https://docs.flutter.dev/get-started/codelab",
        docsLabel: "Flutter Codelab",
    },
    reactnative: {
        description: "A framework for building native mobile apps with React.",
        docsUrl: "https://reactnative.dev/docs/getting-started",
        docsLabel: "React Native Docs",
    },
    electron: {
        description: "A framework for building cross-platform desktop apps with web technologies.",
        docsUrl: "https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app",
        docsLabel: "Electron Tutorial",
    },

    // Concepts & certifications
    systemdesign: {
        description: "The practice of designing scalable, reliable distributed systems — load balancing, caching, sharding and trade-offs.",
        docsUrl: "https://github.com/donnemartin/system-design-primer",
        docsLabel: "System Design Primer",
    },
    mlroadmap: {
        description: "A structured learning path covering ML fundamentals, deep learning, MLOps and deployment.",
        docsUrl: "https://roadmap.sh/ai-engineer",
        docsLabel: "AI Engineer Roadmap",
    },
    metacert: {
        description: "Meta's professional certificate covering frontend development with React and responsive design.",
        docsUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        docsLabel: "Meta Frontend Certificate",
    },
}

export function getTechMeta(id: string, name?: string, category = ""): TechMeta {
    const key = techKey(id) || techKey(name || "")
    const known = TECH_META[key]
    const label = name || id || "Technology"
    const extras = TECH_EXTRAS[key] || CATEGORY_EXTRAS[category] || DEFAULT_EXTRAS

    if (known) {
        return { label, ...known, ...extras }
    }

    if (id?.startsWith("repo:")) {
        return {
            label,
            description: `One of your projects. PathForge reads its languages and dependencies and connects them to the rest of your skill graph.`,
            docsUrl: "https://docs.github.com/en/repositories",
            docsLabel: "GitHub Repositories Guide",
            ...CATEGORY_EXTRAS.repo,
        }
    }

    const categoryLabel = CATEGORY_LABELS[category] || "technology"
    return {
        label,
        description: `${label} is a ${categoryLabel} detected in your connected repositories. It appears in your graph based on your code, dependencies and notes.`,
        docsUrl: `https://devdocs.io/#q=${encodeURIComponent(label)}`,
        docsLabel: "Find Documentation",
        ...extras,
    }
}

// ── Roadmap.sh ───────────────────────────────────────────────────────────
const ROLE_ROADMAPS: Array<{ match: RegExp; url: string; label: string }> = [
    { match: /machine\s*learning|\bml\b|ai\s*engineer|\bai\b/i, url: "https://roadmap.sh/ai-engineer", label: "AI Engineer roadmap" },
    { match: /data\s*scien/i, url: "https://roadmap.sh/ai-data-scientist", label: "AI / Data Scientist roadmap" },
    { match: /full\s*stack/i, url: "https://roadmap.sh/full-stack", label: "Full Stack roadmap" },
    { match: /front\s*end/i, url: "https://roadmap.sh/frontend", label: "Frontend roadmap" },
    { match: /back\s*end/i, url: "https://roadmap.sh/backend", label: "Backend roadmap" },
    { match: /devops|sre|platform/i, url: "https://roadmap.sh/devops", label: "DevOps roadmap" },
    { match: /android/i, url: "https://roadmap.sh/android", label: "Android roadmap" },
    { match: /ios|mobile/i, url: "https://roadmap.sh/android", label: "Mobile roadmap" },
]

export function getRoadmapLink(role: string): { url: string; label: string } {
    const found = ROLE_ROADMAPS.find((r) => r.match.test(role || ""))
    return found
        ? { url: found.url, label: found.label }
        : { url: "https://roadmap.sh/", label: "Explore roadmaps on roadmap.sh" }
}
