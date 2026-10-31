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

export const authGithub = async (code: string) => {
    const res = await api.post('/auth/github', { code })
    return res.data
}

export const syncGithubGraph = async (token: string) => {
    const res = await api.post('/graph/sync/github', { token })
    return res.data
}

export const analyzeRepo = async (url: string, provider: string = 'ollama') => {
    const res = await api.post('/graph/analyze-repo', { url, provider })
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

export default api
