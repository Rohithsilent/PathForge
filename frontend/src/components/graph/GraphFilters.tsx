"use client"
import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGraphStore, FilterSource } from "@/stores/graphStore"
import { Github, Linkedin, Filter, X, GitBranch, Circle, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react"

const SOURCE_COLORS: Record<string, string> = {
    github: "#f97316",
    linkedin: "#0A66C2",
    notion: "#64748b",
    demo: "#8b5cf6",
}

export default function GraphFilters() {
    const {
        graphData, activeRepos, filterSource,
        toggleRepo, clearRepoFilter, setFilterSource,
    } = useGraphStore()

    // Minimize state: defaults to minimized on mobile screens (<768px), open on desktop
    const [isMinimized, setIsMinimized] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsMinimized(true)
        }
    }, [])

    // Derive unique repos from graph nodes
    const repos = useMemo(() => {
        const repoNodes = graphData.nodes.filter((n) => n.category === "repo")
        return repoNodes.map((n) => {
            const connectedIds = new Set<string>()
            // 1. Direct property match
            graphData.nodes.forEach((x) => {
                if (x.repo === n.name || (Array.isArray(x.repos) && x.repos.includes(n.name))) {
                    if (x.id !== n.id) connectedIds.add(x.id)
                }
            })
            // 2. Link match (repo node linked to skill nodes)
            if (graphData.links) {
                graphData.links.forEach((l: any) => {
                    const src = typeof l.source === "string" ? l.source : l.source?.id
                    const tgt = typeof l.target === "string" ? l.target : l.target?.id
                    if (src === n.id && tgt && tgt !== n.id) connectedIds.add(tgt)
                    if (tgt === n.id && src && src !== n.id) connectedIds.add(src)
                })
            }
            return {
                id: n.id,
                name: n.name,
                source: n.source || "github",
                nodeCount: connectedIds.size,
            }
        })
    }, [graphData])

    // Count nodes per source
    const sourceCounts = useMemo(() => {
        const counts: Record<string, number> = { all: graphData.nodes.length }
        graphData.nodes.forEach((n) => {
            counts[n.source] = (counts[n.source] || 0) + 1
        })
        return counts
    }, [graphData])

    const hasFilter = activeRepos.size > 0 || filterSource !== "all"

    if (repos.length === 0 && sourceCounts.all === 0) return null

    return (
        <div className="w-full bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-all">
            {/* Top Bar: Title, Active Status, and Minimize/Expand Toggle */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                        <span className="hidden sm:inline">Sources & Repositories</span>
                        <span className="sm:hidden">Filters</span>
                    </span>

                    {/* Summary badge when minimized or active */}
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        {activeRepos.size > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold truncate">
                                <span>{Array.from(activeRepos)[0]}</span>
                                {activeRepos.size > 1 && <span>+{activeRepos.size - 1}</span>}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        clearRepoFilter()
                                    }}
                                    className="hover:text-orange-950 ml-0.5"
                                    title="Clear repo filter"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400 font-medium truncate">
                                {filterSource !== "all" ? `Source: ${filterSource}` : `${repos.length} repos · ${graphData.nodes.length} nodes`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Minimize / Expand Toggle Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {hasFilter && (
                        <button
                            onClick={() => {
                                clearRepoFilter()
                                setFilterSource("all")
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-700 transition flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                            title="Clear all filters"
                        >
                            <X className="w-3 h-3" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isMinimized
                                ? "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                        }`}
                        title={isMinimized ? "Expand filter panel" : "Minimize filter panel"}
                    >
                        {isMinimized ? (
                            <>
                                <span>Show Filters</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </>
                        ) : (
                            <>
                                <span>Minimize</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {!isMinimized && (
                    <motion.div
                        key="filter-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden pt-2.5 space-y-2.5"
                    >
                        {/* Source filter pills */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                                <Filter className="w-3 h-3 text-slate-400" /> Source
                            </span>
                            {(["all", "github", "linkedin"] as FilterSource[]).map((src) => (
                                <button
                                    key={src}
                                    onClick={() => setFilterSource(src)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                                        filterSource === src
                                            ? src === "all"
                                                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                                : src === "github"
                                                    ? "bg-orange-50 text-orange-700 border-orange-200 shadow-2xs"
                                                    : "bg-blue-50 text-[#0A66C2] border-blue-200 shadow-2xs"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80"
                                    }`}
                                >
                                    {src === "github" && <Github className="w-2.5 h-2.5" />}
                                    {src === "linkedin" && <Linkedin className="w-2.5 h-2.5" />}
                                    {src === "all" ? "All" : src.charAt(0).toUpperCase() + src.slice(1)}
                                    {sourceCounts[src] !== undefined && (
                                        <span className="opacity-60 ml-0.5 text-[10px]">({sourceCounts[src] || 0})</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Per-repo filter pills */}
                        {repos.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <GitBranch className="w-3 h-3 text-slate-400" /> Repositories ({repos.length})
                                    </span>
                                    {activeRepos.size > 0 && (
                                        <button
                                            onClick={clearRepoFilter}
                                            className="text-[10px] text-slate-400 hover:text-slate-700 transition flex items-center gap-1 font-medium"
                                        >
                                            <X className="w-3 h-3" /> Clear selection
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-24 md:max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                                    {repos.map((repo) => {
                                        const active = activeRepos.has(repo.name)
                                        const color = SOURCE_COLORS[repo.source] || "#f97316"
                                        return (
                                            <button
                                                key={repo.id}
                                                onClick={() => toggleRepo(repo.name)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                                                    active
                                                        ? "bg-orange-50 border-orange-300 text-orange-800 font-bold shadow-2xs"
                                                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70"
                                                }`}
                                                title={`${repo.name} · ${repo.nodeCount} connected skills`}
                                            >
                                                <Circle
                                                    className="w-1.5 h-1.5 shrink-0"
                                                    style={{ fill: active ? color : "#94a3b8", color: active ? color : "#94a3b8" }}
                                                />
                                                <span className="truncate max-w-[120px]">{repo.name}</span>
                                                <span className={`text-[10px] ${active ? "text-orange-600" : "text-slate-400"}`}>
                                                    ({repo.nodeCount})
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
