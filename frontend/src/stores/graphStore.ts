import { create } from 'zustand'

interface GraphNode {
    id: string
    name: string
    category: string
    maturity: number
    market_demand: number
    val: number
    source: string
}

interface GraphLink {
    source: string
    target: string
    type: string
    strength: number
}

export type AnalysisEngine = 'ollama' | 'openrouter'

interface GraphState {
    graphData: { nodes: GraphNode[]; links: GraphLink[] }
    selectedNode: GraphNode | null
    searchTerm: string
    filterCategory: string
    marketOverlay: boolean
    recruiterMode: boolean
    showInsights: boolean
    copilotMode: boolean
    roadmapMode: boolean
    analysisEngine: AnalysisEngine
    setGraphData: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void
    setSelectedNode: (node: GraphNode | null) => void
    setSearchTerm: (term: string) => void
    setFilterCategory: (cat: string) => void
    toggleMarketOverlay: () => void
    toggleRecruiterMode: () => void
    toggleInsights: () => void
    toggleCopilotMode: () => void
    toggleRoadmapMode: () => void
    setAnalysisEngine: (engine: AnalysisEngine) => void
}

export const useGraphStore = create<GraphState>((set) => ({
    graphData: { nodes: [], links: [] },
    selectedNode: null,
    searchTerm: '',
    filterCategory: 'all',
    marketOverlay: false,
    recruiterMode: false,
    showInsights: true,
    copilotMode: false,
    roadmapMode: false,
    analysisEngine: 'ollama',
    setGraphData: (data) => set({ graphData: data }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setFilterCategory: (cat) => set({ filterCategory: cat }),
    toggleMarketOverlay: () => set((s) => s.marketOverlay
        ? { marketOverlay: false }
        : { marketOverlay: true, showInsights: false, recruiterMode: false, copilotMode: false, roadmapMode: false }),
    toggleRecruiterMode: () => set((s) => s.recruiterMode
        ? { recruiterMode: false }
        : { recruiterMode: true, showInsights: false, marketOverlay: false, copilotMode: false, roadmapMode: false }),
    toggleInsights: () => set((s) => s.showInsights
        ? { showInsights: false }
        : { showInsights: true, marketOverlay: false, recruiterMode: false, copilotMode: false, roadmapMode: false }),
    toggleCopilotMode: () => set((s) => s.copilotMode
        ? { copilotMode: false }
        : { copilotMode: true, showInsights: false, marketOverlay: false, recruiterMode: false, roadmapMode: false }),
    toggleRoadmapMode: () => set((s) => s.roadmapMode
        ? { roadmapMode: false }
        : { roadmapMode: true, showInsights: false, marketOverlay: false, recruiterMode: false, copilotMode: false }),
    setAnalysisEngine: (engine) => set({ analysisEngine: engine }),
}))
