"use client"
import { useMemo } from "react"
import { motion } from "framer-motion"
import { useGraphStore } from "@/stores/graphStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import AnimatedCounter from "@/components/ui/AnimatedCounter"

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function MarketAnalysisPanel() {
    const { graphData } = useGraphStore()

    const skills = useMemo(() => {
        return graphData.nodes.filter((n) => n.category !== "repo")
    }, [graphData])

    const avgDemand = useMemo(() => {
        if (skills.length === 0) return 0
        return Math.round(skills.reduce((sum, s) => sum + s.market_demand, 0) / skills.length)
    }, [skills])

    const highDemand = useMemo(() => skills.filter((s) => s.market_demand >= 80), [skills])
    const lowDemand = useMemo(() => skills.filter((s) => s.market_demand < 60), [skills])

    const ranked = useMemo(() => {
        return [...skills].sort((a, b) => b.market_demand - a.market_demand)
    }, [skills])

    const categoryStats = useMemo(() => {
        const counts: Record<string, { count: number; avgDemand: number; total: number }> = {}
        for (const s of skills) {
            if (!counts[s.category]) counts[s.category] = { count: 0, avgDemand: 0, total: 0 }
            counts[s.category].count++
            counts[s.category].total += s.market_demand
        }
        return Object.entries(counts)
            .map(([cat, d]) => ({
                category: cat,
                count: d.count,
                avgDemand: Math.round(d.total / d.count),
                color: CATEGORY_COLORS[cat] || "#64748B",
            }))
            .sort((a, b) => b.avgDemand - a.avgDemand)
    }, [skills])

    if (skills.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm font-bold text-slate-900">No skills to analyze</p>
                <p className="text-xs text-slate-400 mt-1">Analyze a repository to see market analysis</p>
            </div>
        )
    }

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-4 p-4 bg-white border-l border-slate-200 overflow-y-auto"
        >
            {/* Header */}
            <motion.div variants={fadeUp}>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Market Analysis
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                    Based on {skills.length} skills in your graph
                </p>
            </motion.div>

            {/* Key Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
                <StatCard label="Avg Demand" value={avgDemand} suffix="%" color={avgDemand >= 75 ? "#10B981" : avgDemand >= 50 ? "#F59E0B" : "#EF4444"} />
                <StatCard label="🔥 Hot Skills" value={highDemand.length} color="#EF4444" />
                <StatCard label="⚠️ Low Demand" value={lowDemand.length} color="#F59E0B" />
            </motion.div>

            {/* Category Breakdown */}
            <motion.div variants={fadeUp} className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    By Category
                </p>
                {categoryStats.map((cat, i) => (
                    <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 capitalize">{cat.category}</span>
                                <span className="text-[10px] font-bold text-slate-400">{cat.count} skills · {cat.avgDemand}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cat.avgDemand}%` }}
                                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Top High-Demand Skills */}
            <motion.div variants={fadeUp} className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    🔥 Highest Demand
                </p>
                {ranked.slice(0, 6).map((skill, i) => (
                    <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors"
                    >
                        <span className="text-[10px] font-bold text-slate-300 w-4 text-right">#{i + 1}</span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[skill.category] || "#64748B" }} />
                        <span className="text-xs font-bold text-slate-800 flex-1">{skill.name}</span>
                        <div className="flex items-center gap-1.5">
                            <DemandBar value={skill.market_demand} delay={0.4 + i * 0.08} />
                            <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                                {skill.market_demand}%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Low-Demand Warning */}
            {lowDemand.length > 0 && (
                <motion.div variants={fadeUp} className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        ⚠️ Consider Upgrading
                    </p>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            {lowDemand.length} of your skills have below-average market demand.
                            Consider complementing them with trending technologies.
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {lowDemand.slice(0, 5).map((s) => (
                                <span key={s.id} className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                    {s.name} ({s.market_demand}%)
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Market Tip */}
            <motion.div variants={fadeUp} className="mt-auto p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">💡 Tip</p>
                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                    Skills with 80%+ demand are highlighted with a red glow in the 3D graph. Toggle Market Analysis to see them!
                </p>
            </motion.div>
        </motion.div>
    )
}

function StatCard({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
    return (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color }}>
                <AnimatedCounter value={value} suffix={suffix || ""} duration={1200} />
            </p>
        </div>
    )
}

function DemandBar({ value, delay = 0 }: { value: number; delay?: number }) {
    const color = value >= 80 ? "#EF4444" : value >= 60 ? "#F59E0B" : "#94A3B8"
    return (
        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, delay }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    )
}
