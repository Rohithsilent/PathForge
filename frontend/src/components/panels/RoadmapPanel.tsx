"use client"
import { useCallback, useEffect, useState } from "react"
import { useSkillStore } from "@/stores/skillStore"
import { useGraphStore } from "@/stores/graphStore"
import { getRoadmapLink } from "@/lib/tech-metadata"

interface RoadmapResource {
    title?: string
    name?: string
    url?: string
}

interface RoadmapPhase {
    title?: string
    phase?: string
    name?: string
    duration?: string
    description?: string
    skills?: string[]
    resources?: (string | RoadmapResource)[]
}

interface Roadmap {
    phases?: RoadmapPhase[]
    total_duration?: string
    career_readiness_after?: number
}

export default function RoadmapPanel() {
    const { targetRole } = useSkillStore()
    const { analysisEngine } = useGraphStore()
    const roadmapLink = getRoadmapLink(targetRole)
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchRoadmap = useCallback(async (signal?: AbortSignal) => {
        setLoading(true)
        setError(false)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const res = await fetch(
                `${apiUrl}/career/roadmap?target_role=${encodeURIComponent(targetRole)}&provider=${analysisEngine}`,
                { signal }
            )
            if (!res.ok) throw new Error(`Roadmap request failed: ${res.status}`)
            const data: Roadmap = await res.json()
            setRoadmap(data)
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return
            console.warn('Could not fetch roadmap:', err)
            setError(true)
            setRoadmap(null)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }, [targetRole, analysisEngine])

    useEffect(() => {
        const controller = new AbortController()
        fetchRoadmap(controller.signal)
        return () => controller.abort()
    }, [fetchRoadmap])

    const phases = roadmap?.phases || []
    const isEmpty = !loading && !error && phases.length === 0

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                                <circle cx="5" cy="12" r="1" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900">Career Roadmap</h2>
                            <p className="text-[10px] text-slate-400 font-medium truncate">Path to {targetRole}</p>
                        </div>
                    </div>
                    <a
                        href={roadmapLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={roadmapLink.label}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                    >
                        Detailed roadmap
                        <ExternalLinkIcon />
                    </a>
                </div>
            </div>

            <div className="flex-1 px-5 py-4">
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="w-4 h-4 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin shrink-0" />
                            <span className="text-[11px] font-semibold">Building your roadmap...</span>
                        </div>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 animate-pulse">
                                <div className="w-1/2 h-3.5 rounded bg-slate-200 mb-3" />
                                <div className="w-3/4 h-3 rounded bg-slate-200 mb-2" />
                                <div className="w-2/3 h-3 rounded bg-slate-200" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center pt-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1">Couldn&apos;t build your roadmap</p>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[260px] mx-auto mb-4">
                            Make sure the backend is running on port 8000, then try again.
                        </p>
                        <button
                            onClick={() => fetchRoadmap()}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[11px] font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : isEmpty ? (
                    <div className="text-center pt-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-orange-50 flex items-center justify-center">
                            <span className="text-xl">🗺️</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1">No roadmap yet</p>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto mb-4">
                            Analyze a repository to generate a roadmap.
                        </p>
                        <button
                            onClick={() => fetchRoadmap()}
                            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-3">
                                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-[0.15em] mb-1">Total Duration</p>
                                <p className="text-base font-bold text-slate-900 leading-none">{roadmap?.total_duration || "—"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">Readiness After</p>
                                <p className="text-base font-bold text-slate-900 leading-none">
                                    {typeof roadmap?.career_readiness_after === "number" ? `${roadmap.career_readiness_after}%` : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Phases */}
                        {phases.map((phase, i) => {
                            const title = phase.title || phase.phase || phase.name || `Phase ${i + 1}`
                            return (
                                <div key={`${title}-${i}`} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </span>
                                            <p className="text-[13px] font-bold text-slate-900 truncate">{title}</p>
                                        </div>
                                        {phase.duration && (
                                            <span className="shrink-0 text-[9px] font-bold text-orange-600 bg-orange-100/70 rounded-full px-2 py-0.5 uppercase tracking-wider">
                                                {phase.duration}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-4 py-3 space-y-3">
                                        {phase.description && (
                                            <p className="text-[11px] text-slate-500 leading-relaxed">{phase.description}</p>
                                        )}

                                        {phase.skills && phase.skills.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {phase.skills.map((skill) => (
                                                        <span key={skill} className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-2 py-0.5">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {phase.resources && phase.resources.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Resources</p>
                                                <ul className="space-y-1">
                                                    {phase.resources.map((resource, ri) => {
                                                        const label = typeof resource === "string"
                                                            ? resource
                                                            : resource.title || resource.name || resource.url || "Resource"
                                                        return (
                                                            <li key={`${label}-${ri}`} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium leading-snug">
                                                                <span className="mt-1 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                                                <span>{label}</span>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Detailed roadmap on roadmap.sh */}
                        <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/60 p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/70 border border-orange-100 flex items-center justify-center shrink-0 text-orange-500">
                                    <ExternalLinkIcon size={15} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-slate-900 mb-1">Want the full picture?</p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Explore the detailed {roadmapLink.label} on roadmap.sh — interactive, free and kept up to date.
                                    </p>
                                </div>
                            </div>
                            <a
                                href={roadmapLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 transition-all"
                            >
                                Explore the detailed {roadmapLink.label} on roadmap.sh
                                <ExternalLinkIcon />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ExternalLinkIcon({ size = 12 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    )
}
