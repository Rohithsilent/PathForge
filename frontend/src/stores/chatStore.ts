import { create } from 'zustand'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

interface ChatState {
    messages: ChatMessage[]
    isOpen: boolean
    isLoading: boolean
    addMessage: (role: 'user' | 'assistant', content: string) => void
    setLoading: (loading: boolean) => void
    toggleChat: () => void
    openChat: () => void
    closeChat: () => void
    clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isOpen: false,
    isLoading: false,
    addMessage: (role, content) =>
        set((s) => ({
            messages: [...s.messages, { role, content, timestamp: Date.now() }],
        })),
    setLoading: (loading) => set({ isLoading: loading }),
    toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),
    clearMessages: () => set({ messages: [] }),
}))
