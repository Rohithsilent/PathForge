import { create } from 'zustand'

interface Gap {
    skill: string
    priority: number
    reason: string
}

interface SkillState {
    currentScore: number
    gaps: Gap[]
    lastUpdated: string | null
    targetRole: string
    setCurrentScore: (score: number) => void
    setGaps: (gaps: Gap[]) => void
    setLastUpdated: (date: string) => void
    setTargetRole: (role: string) => void
}

export const useSkillStore = create<SkillState>((set) => ({
    currentScore: 0,
    gaps: [],
    lastUpdated: null,
    targetRole: 'Full Stack Developer',
    setCurrentScore: (score) => set({ currentScore: score }),
    setGaps: (gaps) => set({ gaps }),
    setLastUpdated: (date) => set({ lastUpdated: date }),
    setTargetRole: (role) => set({ targetRole: role }),
}))
