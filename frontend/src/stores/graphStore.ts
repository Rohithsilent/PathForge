import { create } from 'zustand'

interface GraphNode {
    id: string
    name: string
    category: string
    maturity: number
    market_demand: number
    val: number
    source: string
    repo?: string      // which repo this node belongs to (if from github)
    repos?: string[]   // multiple repos (if skill appears in several)
}

interface GraphLink {
    source: string
    target: string
    type: string
    strength: number
}

export type AnalysisEngine = 'ollama' | 'openrouter'
export type FilterSource = 'all' | 'github' | 'linkedin' | 'leetcode' | 'resume'

interface GraphState {
    graphData: { nodes: GraphNode[]; links: GraphLink[] }
    selectedNode: GraphNode | null
    searchTerm: string
    filterCategory: string
    filterSource: FilterSource       // filter by data source
    activeRepos: Set<string>         // empty = show all repos
    marketOverlay: boolean
    recruiterMode: boolean
    showInsights: boolean
    copilotMode: boolean
    roadmapMode: boolean
    analysisEngine: AnalysisEngine
    webglSupported: boolean | null
    setWebglSupported: (supported: boolean) => void
    setGraphData: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void
    setSelectedNode: (node: GraphNode | null) => void
    setSearchTerm: (term: string) => void
    setFilterCategory: (cat: string) => void
    setFilterSource: (source: FilterSource) => void
    toggleRepo: (repoName: string) => void
    setActiveRepos: (repos: Set<string>) => void
    clearRepoFilter: () => void
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
    filterSource: 'all',
    activeRepos: new Set<string>(),
    marketOverlay: false,
    recruiterMode: false,
    showInsights: true,
    copilotMode: false,
    roadmapMode: false,
    analysisEngine: 'ollama',
    webglSupported: null,
    setWebglSupported: (supported) => set({ webglSupported: supported }),
    setGraphData: (data) => set({ graphData: data }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setFilterCategory: (cat) => set({ filterCategory: cat }),
    setFilterSource: (source) => set({ filterSource: source }),
    toggleRepo: (repoName) => set((s) => {
        const next = new Set(s.activeRepos)
        if (next.has(repoName)) next.delete(repoName)
        else next.add(repoName)
        return { activeRepos: next }
    }),
    setActiveRepos: (repos) => set({ activeRepos: repos }),
    clearRepoFilter: () => set({ activeRepos: new Set<string>() }),
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

if (typeof window !== 'undefined') {
    (window as any).useGraphStore = useGraphStore
}
