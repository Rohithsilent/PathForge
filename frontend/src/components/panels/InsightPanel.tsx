"use client"
import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGraphStore } from "@/stores/graphStore"
import { useSkillStore } from "@/stores/skillStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import { getTechMeta } from "@/lib/tech-metadata"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ScoreRing from "@/components/ui/ScoreRing"
import WhatIfSimulator from "@/components/panels/WhatIfSimulator"
import RecruiterCard from "@/components/panels/RecruiterCard"

const ROLES = [
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "ML Engineer",
    "Data Scientist",
]

const CATEGORY_NAMES: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    database: "Database",
    devops: "DevOps",
    ml: "ML / AI",
    language: "Language",
    concept: "Concept",
    mobile: "Mobile",
    cert: "Certification",
    repo: "Repository",
}

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function InsightPanel() {
    const { selectedNode, recruiterMode, graphData, analysisEngine } = useGraphStore()
    const { currentScore, gaps, targetRole, setCurrentScore, setGaps, setTargetRole } = useSkillStore()
    const [loading, setLoading] = useState(false)
    const selectedMeta = selectedNode
        ? getTechMeta(selectedNode.id, selectedNode.name, selectedNode.category)
        : null

    // Technologies this node is directly connected to in the user's own graph.
    const connectedSkills = useMemo(() => {
        if (!selectedNode) return []
        const names = new Map(graphData.nodes.map((n) => [n.id, n.name]))
        const connected = new Set<string>()
        for (const link of graphData.links) {
            if (link.source === selectedNode.id && names.has(link.target)) {
                connected.add(names.get(link.target) as string)
            } else if (link.target === selectedNode.id && names.has(link.source)) {
                connected.add(names.get(link.source) as string)
            }
        }
        return Array.from(connected)
    }, [graphData, selectedNode])

    useEffect(() => {
        const fetchCareer = async () => {
            setLoading(true)
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                const res = await fetch(
                    `${apiUrl}/career/readiness?target_role=${encodeURIComponent(targetRole)}&provider=${analysisEngine}`
                )
                if (res.ok) {
                    const data = await res.json()
                    setCurrentScore(data.career_readiness)
                    setGaps(data.gaps || [])
                }
            } catch (err) {
                console.warn('Could not fetch career data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchCareer()
    }, [targetRole, analysisEngine, setCurrentScore, setGaps])

    if (recruiterMode) {
        return <RecruiterCard />
    }

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-4 p-4 bg-white border-l border-slate-200 overflow-y-auto"
        >
            {/* Header + Role Selector */}
            <motion.div variants={fadeUp}>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Insights
                </h2>
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Target Role
                    </label>
                    <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg appearance-none cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    >
                        {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 bottom-2.5 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
            </motion.div>

            {/* Score Ring */}
            <motion.div variants={fadeUp} className="flex justify-center py-2">
                <ScoreRing score={currentScore || 0} label="Career Readiness" />
            </motion.div>

            {/* Selected Node Detail */}
            <AnimatePresence mode="wait">
                {selectedNode && selectedMeta ? (
                    <motion.div
                        key={selectedNode.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Card className="bg-slate-50/50 border-slate-200 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] || "#64748B" }}
                                    />
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                        {selectedNode.name}
                                    </h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                <p className="text-xs leading-relaxed text-slate-600">
                                    {selectedMeta.description}
                                </p>

                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        What it&apos;s used for
                                    </p>
                                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                                        {selectedMeta.usedFor}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <a
                                        href={selectedMeta.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={selectedMeta.docsLabel}
                                        className="group flex items-center justify-between gap-2 w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 hover:border-orange-300 active:bg-orange-100 transition-colors"
                                    >
                                        <span className="truncate">Learn {selectedNode.name}</span>
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            className="shrink-0 text-orange-500 group-hover:text-orange-600"
                                        >
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15 3 21 3 21 9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </a>
                                    <p className="text-[10px] font-medium text-slate-400 pl-1">
                                        Official source · {selectedMeta.docsLabel}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <MetricBox
                                        label="Market demand"
                                        value={`${selectedNode.market_demand}%`}
                                        hint={demandTier(selectedNode.market_demand)}
                                    />
                                    <MetricBox
                                        label="Category"
                                        value={CATEGORY_NAMES[selectedNode.category] || selectedNode.category}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>DEMAND FOR THIS SKILL</span>
                                        <span style={{ color: demandColor(selectedNode.market_demand) }}>
                                            {demandTier(selectedNode.market_demand)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${selectedNode.market_demand}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: demandColor(selectedNode.market_demand) }}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            Learning curve
                                        </span>
                                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${difficultyClass(selectedMeta.difficulty)}`}>
                                            {selectedMeta.difficulty}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            Pairs well with
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {selectedMeta.pairsWith.slice(0, 4).map((pair) => (
                                                <span
                                                    key={pair}
                                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                                >
                                                    {pair}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {connectedSkills.length > 0 && (
                                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            Connected in your graph
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {connectedSkills.slice(0, 5).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {connectedSkills.length > 5 && (
                                                <span className="px-1 py-0.5 text-[10px] font-semibold text-slate-400">
                                                    +{connectedSkills.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="no-selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Card className="border-dashed border-slate-200 bg-slate-50/50 shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs leading-relaxed text-slate-500">
                                    Click any node in the graph to see what it is, its demand and where to learn it.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* What-If Simulator */}
            <motion.div variants={fadeUp}>
                <WhatIfSimulator />
            </motion.div>

            {/* Skill Gaps */}
            <motion.div variants={fadeUp} className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Skill Gaps
                    </p>
                    {loading && (
                        <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    )}
                </div>
                {gaps.length === 0 && !loading && (
                    <p className="text-xs text-slate-400 italic">
                        {currentScore > 0
                            ? "No gaps detected for this role."
                            : "Analyze a repository to detect gaps."}
                    </p>
                )}
                {gaps.map((gap, i) => (
                    <motion.div
                        key={gap.skill}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <Card className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition-colors shadow-sm border-slate-200">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{gap.skill}</span>
                                    <Badge variant="secondary" className="text-[9px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100">
                                        P{Math.round(gap.priority * 100)}
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                                    {gap.reason}
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}

function MetricBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{value}</p>
            {hint && <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{hint}</p>}
        </div>
    )
}

// Same demand colour tiers used by the graph.
function demandColor(demand: number): string {
    if (demand >= 80) return "#ef4444"
    if (demand >= 60) return "#f59e0b"
    return "#64748b"
}

function demandTier(demand: number): string {
    if (demand >= 80) return "Very high"
    if (demand >= 60) return "Steady"
    return "Niche"
}

function difficultyClass(difficulty: string): string {
    if (difficulty === "Beginner-friendly") return "border-emerald-200 bg-emerald-50 text-emerald-700"
    if (difficulty === "Advanced") return "border-red-200 bg-red-50 text-red-600"
    return "border-amber-200 bg-amber-50 text-amber-700"
}
