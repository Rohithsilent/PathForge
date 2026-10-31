import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 180000, // local models can be slow on first load
})

// Attach auth token to every request
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Retry logic with exponential backoff for network errors
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config
        if (!config) return Promise.reject(error)

        // Initialize retry count
        config.__retryCount = config.__retryCount || 0

        // Only retry on network errors or 5xx server errors
        const isNetworkError = !error.response
        const isServerError = error.response?.status >= 500

        if ((isNetworkError || isServerError) && config.__retryCount < MAX_RETRIES) {
            config.__retryCount += 1
            const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1)
            console.log(`API retry ${config.__retryCount}/${MAX_RETRIES} after ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            return api(config)
        }

        return Promise.reject(error)
    }
)

// ── Auth ───────────────────────────────────────────────────────────────
export const authGithub = async (code: string) => {
    const res = await api.post('/auth/github', { code })
    return res.data
}

/** Sign in with a Firebase ID token (Google Sign-In) */
export const authFirebase = async (idToken: string) => {
    const res = await api.post('/auth/firebase', { id_token: idToken })
    return res.data as {
        access_token: string
        user: {
            name: string
            username: string
            email: string
            avatar: string
            auth_provider: string
            github_username_hint?: string
            github_username?: string
            github_connected?: boolean
            linkedin_username?: string
            linkedin_connected?: boolean
            onboarding_completed?: boolean
            target_role: string
        }
    }
}

// ── GitHub ─────────────────────────────────────────────────────────────
export const syncGithubGraph = async (token: string) => {
    const res = await api.post('/graph/sync/github', { token })
    return res.data
}

export const analyzeRepo = async (url: string, provider: string = 'ollama') => {
    const res = await api.post('/graph/analyze-repo', { url, provider })
    return res.data
}

/** Analyze a full GitHub profile by username — builds multi-repo knowledge graph */
export const analyzeGithubProfile = async (username: string, token?: string) => {
    const res = await api.post('/github/profile/analyze', { username, token })
    return res.data as {
        status: string
        profile: GitHubProfile
        repos: GitHubRepo[]
        nodes: number
        links: number
        graph?: { nodes: any[]; links: any[] }
    }
}

/** Fetch a GitHub user's public profile metadata */
export const getGithubUser = async (username: string) => {
    const res = await api.get(`/github/user/${username}`)
    return res.data as GitHubProfile
}

// ── LinkedIn ──────────────────────────────────────────────────────────
/** Paste LinkedIn profile text — AI extracts skills and merges into graph */
export const analyzeLinkedInProfile = async (profileText: string, profileUrl?: string) => {
    const res = await api.post('/linkedin/analyze', {
        profile_text: profileText,
        profile_url: profileUrl || null,
    })
    return res.data as {
        status: string
        extracted: {
            username: string | null
            skills: string[]
            domain: string
            domains: string[]
            roles: string[]
            years_experience: number
        }
        new_nodes: number
        new_links: number
        total_nodes: number
        graph?: { nodes: any[]; links: any[] }
    }
}

// ── User Profile & Connected Accounts ──────────────────────────────────
export const getUserProfile = async () => {
    const res = await api.get('/user/profile')
    return res.data
}

export const updateUserProfile = async (updates: Record<string, any>) => {
    const res = await api.post('/user/profile', updates)
    return res.data
}

export interface AIProviderInfo {
    id: string
    label: string
    model: string
    available: boolean
    local: boolean
    cloud: boolean
    base_url: string
}

export const getAIStatus = async () => {
    const res = await api.get('/ai/status')
    return res.data as {
        provider: string
        model: string
        open_weights: boolean
        local: boolean
        cloud: boolean
        configured: boolean
        demo_mode: boolean
        providers?: AIProviderInfo[]
    }
}

// ── Types ─────────────────────────────────────────────────────────────
export interface GitHubProfile {
    username: string
    name: string
    avatar: string
    bio: string
    company: string
    location: string
    blog: string
    twitter: string
    followers: number
    following: number
    public_repos: number
    public_gists: number
    created_at: string
    html_url: string
}

export interface GitHubRepo {
    name: string
    description: string
    languages: Record<string, number>
    commits: number
    stars: number
    topics: string[]
    skills: string[]
    domain: string
    url: string
}

export default api
