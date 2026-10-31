import { create } from 'zustand'

interface AuthState {
    user: {
        name: string
        username: string
        avatar: string
        target_role: string
    } | null
    isDemo: boolean
    setUser: (user: AuthState['user']) => void
    setIsDemo: (demo: boolean) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isDemo: false,
    setUser: (user) => set({ user }),
    setIsDemo: (demo) => set({ isDemo: demo }),
    logout: () => set({ user: null, isDemo: false }),
}))
