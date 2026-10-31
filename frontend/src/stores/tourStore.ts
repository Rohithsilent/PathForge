import { create } from 'zustand'

interface TourState {
    isTourActive: boolean
    startTour: () => void
    endTour: () => void
}

export const useTourStore = create<TourState>((set) => ({
    isTourActive: false,
    startTour: () => set({ isTourActive: true }),
    endTour: () => set({ isTourActive: false }),
}))
