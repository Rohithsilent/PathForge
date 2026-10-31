"use client"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts"
import { useGraphStore } from "@/stores/graphStore"
import { useSkillStore } from "@/stores/skillStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import ScoreRing from "@/components/ui/ScoreRing"
import AnimatedCounter from "@/components/ui/AnimatedCounter"

const CATEGORY_LABELS: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    ml: "ML / AI",
    devops: "DevOps",
    database: "Database",
    language: "Language",
    concept: "Concept",
    mobile: "Mobile",
    cert: "Certification",
    repo: "Repository",
}

const tooltipStyle = {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontFamily: "var(--font-geist-mono)",
    fontSize: "11px",
    color: "#1E293B",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}

export default function AnalyticsPage() {
    const router = useRouter()
    const { graphData, setGraphData, analysisEngine } = useGraphStore()
    const { currentScore, targetRole, setCurrentScore } = useSkillStore()
    const [mountKey, setMountKey] = useState(0)
    const [chartsReady, setChartsReady] = useState(false)

    // Force re-mount animations on every visit
    useEffect(() => {
        setMountKey(Date.now())
    }, [])

    // Fetch graph data if not already loaded
    useEffect(() => {
        if (graphData.nodes.length === 0) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            fetch(`${apiUrl}/graph/`)
                .then((r) => r.json())
                .then((d) => { if (d.nodes?.length > 0) setGraphData(d) })
                .catch(() => { })
        }
    }, [graphData.nodes.length, setGraphData])

    // Fetch career readiness for the selected target role (refetch on change)
    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        fetch(`${apiUrl}/career/readiness?target_role=${encodeURIComponent(targetRole)}&provider=${analysisEngine}`)
            .then((r) => r.json())
            .then((d) => { if (typeof d.career_readiness === "number") setCurrentScore(d.career_readiness) })
            .catch(() => { })
    }, [targetRole, analysisEngine, setCurrentScore])

    const allNodes = graphData.nodes
    const skills = useMemo(() => allNodes.filter((n) => n.category !== "repo"), [allNodes])
    const repos = useMemo(() => allNodes.filter((n) => n.category === "repo"), [allNodes])

    // ── Computed Stats ──
    const avgMaturity = useMemo(() => {
        if (skills.length === 0) return 0
        return Math.round(skills.reduce((s, n) => s + n.maturity, 0) / skills.length)
    }, [skills])

    const avgDemand = useMemo(() => {
        if (skills.length === 0) return 0
        return Math.round(skills.reduce((s, n) => s + n.market_demand, 0) / skills.length)
    }, [skills])

    const sources = useMemo(() => {
        const s = new Set(allNodes.map((n) => n.source).filter(Boolean))
        return s.size
    }, [allNodes])

    // ── Pie: Skill Distribution by Category ──
    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const s of skills) {
            const cat = s.category
            counts[cat] = (counts[cat] || 0) + 1
        }
        return Object.entries(counts)
            .map(([key, value]) => ({
                name: CATEGORY_LABELS[key] || key,
                value,
                color: CATEGORY_COLORS[key] || "#64748B",
            }))
            .sort((a, b) => b.value - a.value)
    }, [skills])

    // ── Radar: Category Maturity ──
    const radarData = useMemo(() => {
        const categories: Record<string, { total: number; count: number }> = {}
        for (const s of skills) {
            if (!categories[s.category]) categories[s.category] = { total: 0, count: 0 }
            categories[s.category].total += s.maturity
            categories[s.category].count++
        }
        return Object.entries(categories)
            .map(([cat, d]) => ({
                axis: CATEGORY_LABELS[cat] || cat,
                value: Math.round(d.total / d.count),
                fullMark: 100,
            }))
    }, [skills])

    // ── Bar: Top 12 skills by maturity ──
    const maturityData = useMemo(() => {
        return [...skills]
            .sort((a, b) => b.maturity - a.maturity)
            .slice(0, 12)
            .map((n) => ({
                name: n.name,
                maturity: n.maturity,
                demand: n.market_demand,
                fill: CATEGORY_COLORS[n.category] || "#64748B",
            }))
    }, [skills])

    // ── Bar: Maturity vs Demand comparison (top 8) ──
    const comparisonData = useMemo(() => {
        return [...skills]
            .sort((a, b) => b.market_demand - a.market_demand)
            .slice(0, 8)
            .map((n) => ({
                name: n.name,
                maturity: n.maturity,
                demand: n.market_demand,
            }))
    }, [skills])

    // Recharts only runs its entrance animation when a chart mounts with data
    // already available. Hold the charts back for one paint (after the data
    // fetch settles) so every bar, slice and radar line animates in visibly.
    const dataSignature = `${graphData.nodes.length}:${graphData.links.length}:${skills.length}`
    useEffect(() => {
        if (graphData.nodes.length === 0) return
        setChartsReady(false)
        const timer = setTimeout(() => setChartsReady(true), 260)
        return () => clearTimeout(timer)
    }, [dataSignature, graphData.nodes.length])

    // ── Empty state ──
    if (allNodes.length === 0) {
        return (
            <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="text-lg font-bold text-slate-900 mb-2">No data yet</p>
                    <p className="text-sm text-slate-500 mb-4">Analyze a repository on the dashboard to populate analytics</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-sm font-bold text-orange-600 hover:underline"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div key={mountKey} className="min-h-screen bg-[#F4F7FE]">
            {/* Header */}
            <div className="h-auto md:h-14 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-6 py-3 sm:py-0 gap-2 sm:gap-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-xs font-bold font-mono text-slate-500 hover:text-orange-600 transition-colors"
                    >
                        ← Back to Graph
                    </button>
                    <span className="text-slate-300">|</span>
                    <h1 className="text-sm font-bold font-mono text-slate-900 tracking-wide">Analytics Dashboard</h1>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <span>{skills.length} skills</span>
                    <span>·</span>
                    <span>{repos.length} repos</span>
                    <span>·</span>
                    <span>{sources} sources</span>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
                {/* Score row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <ScoreCard score={currentScore || 0} label="Career Ready" color="#0891B2" delay={0} />
                    <ScoreCard score={avgMaturity} label="Avg Maturity" color="#059669" delay={0.1} />
                    <ScoreCard score={avgDemand} label="Market Fit" color="#7C3AED" delay={0.2} />
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-6 flex flex-col items-center justify-center shadow-sm border border-slate-100"
                    >
                        <p className="text-3xl font-bold text-amber-600"><AnimatedCounter value={skills.length} duration={1500} /></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Skills</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Skill Distribution Pie */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
                    >
                        <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">
                            Skill Distribution
                        </h3>
                        {chartsReady ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={50}
                                        dataKey="value"
                                        stroke="#FFFFFF"
                                        strokeWidth={3}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        isAnimationActive
                                        animationBegin={120}
                                        animationDuration={1600}
                                        animationEasing="ease-out"
                                    >
                                        {distributionData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#475569" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <ChartSkeleton />
                        )}
                    </motion.div>

                    {/* Domain Radar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
                    >
                        <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">
                            Category Maturity
                        </h3>
                        {chartsReady ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#E2E8F0" />
                                    <PolarAngleAxis
                                        dataKey="axis"
                                        tick={{ fill: "#64748B", fontSize: 10, fontFamily: "var(--font-geist-mono)", fontWeight: "bold" }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={{ fill: "#94A3B8", fontSize: 8 }}
                                        axisLine={false}
                                    />
                                    <Radar
                                        dataKey="value"
                                        stroke="#06B6D4"
                                        fill="#06B6D4"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                        isAnimationActive
                                        animationBegin={180}
                                        animationDuration={1600}
                                        animationEasing="ease-out"
                                    />
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "#475569" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ChartSkeleton />
                        )}
                    </motion.div>

                    {/* Maturity vs Demand Comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
                    >
                        <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">
                            Your Maturity vs Market Demand
                        </h3>
                        {chartsReady ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={comparisonData}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: "#64748B", fontSize: 9, fontFamily: "var(--font-geist-mono)", fontWeight: "bold" }}
                                        axisLine={{ stroke: "#E2E8F0" }}
                                        tickLine={false}
                                        angle={-20}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: "#94A3B8", fontSize: 10 }}
                                        axisLine={{ stroke: "#E2E8F0" }}
                                        tickLine={false}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F1F5F9" }} itemStyle={{ color: "#475569" }} />
                                    <Legend
                                        wrapperStyle={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", fontWeight: "bold" }}
                                    />
                                    <Bar dataKey="maturity" name="Your Maturity" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive animationBegin={120} animationDuration={1500} animationEasing="ease-out" />
                                    <Bar dataKey="demand" name="Market Demand" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive animationBegin={260} animationDuration={1500} animationEasing="ease-out" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ChartSkeleton />
                        )}
                    </motion.div>

                    {/* Skill Maturity Ranking */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
                    >
                        <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">
                            Skill Maturity Ranking
                        </h3>
                        {chartsReady ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={maturityData} layout="vertical">
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        tick={{ fill: "#94A3B8", fontSize: 10 }}
                                        axisLine={{ stroke: "#E2E8F0" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={80}
                                        tick={{ fill: "#64748B", fontSize: 9, fontFamily: "var(--font-geist-mono)", fontWeight: "bold" }}
                                        axisLine={{ stroke: "#E2E8F0" }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        cursor={{ fill: "#F1F5F9" }}
                                        itemStyle={{ color: "#475569" }}
                                    />
                                    <Bar dataKey="maturity" radius={[0, 4, 4, 0]} isAnimationActive animationBegin={160} animationDuration={1500} animationEasing="ease-out">
                                        {maturityData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <ChartSkeleton />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

function ChartSkeleton() {
    return (
        <div className="flex h-[250px] items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
        </div>
    )
}

function ScoreCard({ score, label, color, delay }: { score: number; label: string; color: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-xl p-6 flex justify-center shadow-sm border border-slate-100"
        >
            <ScoreRing score={score} label={label} color={color} />
        </motion.div>
    )
}
