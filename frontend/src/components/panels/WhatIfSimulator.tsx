import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSkillStore } from "@/stores/skillStore"
import { useGraphStore } from "@/stores/graphStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

export default function WhatIfSimulator() {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [delta, setDelta] = useState<number | null>(null)
    const [originalScore, setOriginalScore] = useState<number | null>(null)
    const [newScore, setNewScore] = useState<number | null>(null)
    const [reason, setReason] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { currentScore, gaps, targetRole } = useSkillStore()
    const { analysisEngine, graphData } = useGraphStore()

    const simulate = async (skill?: string) => {
        const skillToSim = (skill || input).trim()
        if (!skillToSim) return
        setLoading(true)
        setDelta(null)
        setOriginalScore(null)
        setNewScore(null)
        setReason(null)
        setError(null)
        if (skill) setInput(skill)

        try {
            const res = await api.post('/career/whatif', {
                add_skills: [skillToSim],
                engine: "orbitx",
                provider: analysisEngine,
                target_role: targetRole,
            })
            const data = res.data
            setDelta(data.score_delta)
            setOriginalScore(data.original_score)
            setNewScore(data.new_score)
            setReason(data.reason || null)
        } catch {
            setError("Couldn't run the simulation. Check that the backend is running and try again.")
        } finally {
            setLoading(false)
            setInput("")
        }
    }

    // Use real detected gaps as badge suggestions, fall back to defaults only with graph data
    const suggestions = gaps && gaps.length > 0
        ? gaps.slice(0, 3).map((g: { skill: string }) => g.skill)
        : graphData?.nodes?.length > 0
            ? ["Docker", "TypeScript", "PostgreSQL"]
            : []

    const fmtScore = (n: number | null | undefined) =>
        n === null || n === undefined ? "—" : Number.isInteger(n) ? `${n}` : n.toFixed(1)
    const increased = (delta ?? 0) > 0
    const deltaLabel = delta === null
        ? ""
        : delta === 0
            ? "0%"
            : `+${Number.isInteger(delta) ? delta : delta.toFixed(1)}%`

    return (
        <div className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                What If You Learned...
            </p>

            <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && simulate()}
                    placeholder="type a skill + enter"
                    className="flex-1 bg-white font-bold text-slate-900"
                    disabled={loading}
                />
                <Button
                    onClick={() => simulate()}
                    disabled={loading || !input.trim()}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    size="sm"
                >
                    {loading ? "..." : "→"}
                </Button>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {delta !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="space-y-2"
                    >
                        <div className={`flex items-center gap-3 p-3 rounded-lg border ${increased ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}>
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className={`font-bold text-2xl ${increased ? "text-emerald-500" : "text-slate-400"}`}
                            >
                                {deltaLabel}
                            </motion.span>
                            <div className="text-xs text-slate-500 font-medium">
                                <div>Career Readiness {increased ? "↑" : "→"}</div>
                                <div className="text-slate-900 font-bold">
                                    {fmtScore(originalScore ?? currentScore)}% → {fmtScore(newScore)}%
                                </div>
                            </div>
                        </div>
                        {reason && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-[11px] text-slate-500 leading-relaxed px-1 italic"
                            >
                                🤖 {reason}
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-1">
                {suggestions.map((skill: string) => (
                    <Badge
                        key={skill}
                        variant="outline"
                        onClick={() => simulate(skill)}
                        className="cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 bg-white text-slate-500 font-bold border-slate-200 transition-colors"
                    >
                        + {skill}
                    </Badge>
                ))}
            </div>
        </div>
    )
}
