import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
    name: string
    username: string
    email?: string
    avatar: string
    target_role: string
    auth_provider?: 'github' | 'google' | 'demo'
    github_username?: string
    github_username_hint?: string  // suggested github username from email (Google login)
    linkedin_username?: string
    linkedin_connected?: boolean
    github_connected?: boolean
    leetcode_username?: string
    leetcode_connected?: boolean
    leetcode_stats?: any
    resume_connected?: boolean
    resume_filename?: string
    resume_skills?: any[]
    onboarding_completed?: boolean
}

interface AuthState {
    user: AuthUser | null
    isDemo: boolean
    githubProfile: {
        username: string
        avatar: string
        bio: string
        followers: number
        public_repos: number
        html_url: string
    } | null
    setUser: (user: AuthUser | null) => void
    setIsDemo: (demo: boolean) => void
    setGithubProfile: (profile: AuthState['githubProfile']) => void
    updateGithubUsername: (username: string) => void
    updateLinkedinUsername: (username: string) => void
    setLinkedinConnected: (connected: boolean) => void
    setGithubConnected: (connected: boolean) => void
    updateLeetCodeUsername: (username: string) => void
    setLeetCodeConnected: (connected: boolean, stats?: any) => void
    setResumeConnected: (connected: boolean, filename?: string, skills?: any[]) => void
    setOnboardingCompleted: (completed: boolean) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isDemo: false,
            githubProfile: null,

            setUser: (user) => set({ user }),
            setIsDemo: (demo) => set({ isDemo: demo }),
            setGithubProfile: (profile) => set({ githubProfile: profile }),

            updateGithubUsername: (username) =>
                set((state) => ({
                    user: state.user ? { ...state.user, github_username: username } : state.user,
                })),

            updateLinkedinUsername: (username) =>
                set((state) => ({
                    user: state.user ? { ...state.user, linkedin_username: username } : state.user,
                })),

            setLinkedinConnected: (connected) =>
                set((state) => ({
                    user: state.user ? { ...state.user, linkedin_connected: connected } : state.user,
                })),

            setGithubConnected: (connected) =>
                set((state) => ({
                    user: state.user ? { ...state.user, github_connected: connected } : state.user,
                })),

            updateLeetCodeUsername: (username) =>
                set((state) => ({
                    user: state.user ? { ...state.user, leetcode_username: username } : state.user,
                })),

            setLeetCodeConnected: (connected, stats) =>
                set((state) => ({
                    user: state.user ? {
                        ...state.user,
                        leetcode_connected: connected,
                        ...(stats ? { leetcode_stats: stats } : {}),
                    } : state.user,
                })),

            setResumeConnected: (connected, filename, skills) =>
                set((state) => ({
                    user: state.user ? {
                        ...state.user,
                        resume_connected: connected,
                        ...(filename ? { resume_filename: filename } : {}),
                        ...(skills ? { resume_skills: skills } : {}),
                    } : state.user,
                })),

            setOnboardingCompleted: (completed) =>
                set((state) => ({
                    user: state.user ? { ...state.user, onboarding_completed: completed } : state.user,
                })),

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('pathforge-auth')
                    sessionStorage.clear()
                }
                set({ user: null, isDemo: false, githubProfile: null })
            },
        }),
        {
            name: 'pathforge-auth', // persisted to localStorage
            partialize: (state) => ({
                user: state.user,
                isDemo: state.isDemo,
                githubProfile: state.githubProfile,
            }),
        }
    )
)
