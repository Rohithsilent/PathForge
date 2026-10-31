"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"

/* ──────────────────────────────────────────
   SIMULATED ANALYSIS STAGES
   ────────────────────────────────────────── */
const STAGES = [
    {
        title: "Connecting to GitHub",
        detail: "Authenticating and locating 4 public repositories",
        duration: 2200,
    },
    {
        title: "Scanning repositories",
        detail: "Reading languages, dependency files and READMEs",
        duration: 2600,
    },
    {
        title: "Extracting technologies",
        detail: "Cross-checking 17 skills against the tech directory",
        duration: 2400,
    },
    {
        title: "Scoring market demand",
        detail: "Comparing against live role requirements",
        duration: 2400,
    },
    {
        title: "Building your knowledge graph",
        detail: "Laying out 21 nodes and 36 connections in 3D",
        duration: 2400,
    },
] as const

const TOTAL_DURATION = STAGES.reduce((sum, stage) => sum + stage.duration, 0)
const TICK_MS = 40
const COMPLETE_HOLD_MS = 420
const EASE = [0.22, 1, 0.36, 1] as const

function getActiveIndex(elapsed: number) {
    let boundary = 0
    for (let i = 0; i < STAGES.length; i++) {
        boundary += STAGES[i].duration
        if (elapsed < boundary) return i
    }
    return STAGES.length
}

/* ──────────────────────────────────────────
   AMBIENT ORBIT BACKDROP
   ────────────────────────────────────────── */
function OrbitBackdrop() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Soft orange radial glow */}
            <div
                className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.035) 38%, transparent 70%)",
                }}
            />

            {/* Faint grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

            {/* Orbit rings with travelling dots */}
            {[300, 460, 640, 840].map((size, i) => (
                <motion.div
                    key={size}
                    className="absolute left-1/2 top-1/2 rounded-full border border-orange-300/20"
                    style={{
                        width: size,
                        height: size,
                        marginLeft: -size / 2,
                        marginTop: -size / 2,
                        borderStyle: i % 2 === 0 ? "solid" : "dashed",
                    }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 42 + i * 16, repeat: Infinity, ease: "linear" }}
                >
                    <span
                        className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                            background: i % 2 === 0 ? "#FB923C" : "#FDBA74",
                            boxShadow: "0 0 12px rgba(249,115,22,0.45)",
                        }}
                    />
                </motion.div>
            ))}
        </div>
    )
}

/* ──────────────────────────────────────────
   DEMO LOADER
   ────────────────────────────────────────── */
export default function DemoLoader({ onComplete }: { onComplete: () => void }) {
    const [elapsed, setElapsed] = useState(0)
    const completedRef = useRef(false)
    const onCompleteRef = useRef(onComplete)

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
        const startedAt = Date.now()
        let interval: number | undefined
        let completionTimer: number | undefined

        const tick = () => {
            const next = Math.min(Date.now() - startedAt, TOTAL_DURATION)
            setElapsed(next)

            if (next >= TOTAL_DURATION) {
                if (interval !== undefined) window.clearInterval(interval)
                if (!completedRef.current) {
                    completedRef.current = true
                    completionTimer = window.setTimeout(
                        () => onCompleteRef.current(),
                        COMPLETE_HOLD_MS
                    )
                }
            }
        }

        interval = window.setInterval(tick, TICK_MS)
        tick()

        return () => {
            if (interval !== undefined) window.clearInterval(interval)
            if (completionTimer !== undefined) window.clearTimeout(completionTimer)
        }
    }, [])

    const activeIndex = getActiveIndex(elapsed)
    const allDone = elapsed >= TOTAL_DURATION
    const progress = Math.min(100, (elapsed / TOTAL_DURATION) * 100)
    const displayPct = allDone ? 100 : Math.floor(progress)
    const currentStage = STAGES[Math.min(activeIndex, STAGES.length - 1)]

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-loader-title"
            aria-describedby="demo-loader-subtitle"
            className={`fixed inset-0 z-[100] overflow-y-auto bg-[#FCFCFD] ${GeistSans.className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <OrbitBackdrop />

            <div className="relative flex min-h-full items-center justify-center px-4 py-10">
                <motion.div
                    className="w-full max-w-lg"
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                >
                    <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl shadow-orange-500/[0.06] backdrop-blur-xl sm:p-8">
                        {/* ── Brand row ── */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
                                    <motion.span
                                        className="absolute inset-[3px] rounded-full border border-dashed border-orange-300/80"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.7)]" />
                                </span>
                                <span
                                    className="text-[17px] font-bold tracking-tight"
                                    style={{ fontFamily: "var(--font-pixel), monospace", color: "#F97316" }}
                                >
                                    PathForge
                                </span>
                            </div>
                            <span
                                className={`rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400 ${GeistMono.className}`}
                            >
                                Demo
                            </span>
                        </div>

                        {/* ── Headline ── */}
                        <h2
                            id="demo-loader-title"
                            className="mt-6 text-[24px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[28px]"
                        >
                            Building your career universe
                        </h2>
                        <p
                            id="demo-loader-subtitle"
                            className="mt-2 text-[13.5px] font-medium leading-relaxed text-slate-500"
                        >
                            Analyzing a sample developer profile — no signup required.
                        </p>

                        {/* ── Stages ── */}
                        <ul className="mt-6 space-y-3.5">
                            {STAGES.map((stage, i) => {
                                const complete = allDone || i < activeIndex
                                const active = !allDone && i === activeIndex

                                return (
                                    <li key={stage.title} className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${complete
                                                    ? "bg-orange-500 text-white"
                                                    : active
                                                        ? "border-2 border-orange-400 bg-orange-50"
                                                        : "border border-slate-200 bg-white"
                                                }`}
                                            aria-hidden="true"
                                        >
                                            {complete ? (
                                                <motion.span
                                                    initial={{ scale: 0.4, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                                >
                                                    <Check className="h-3 w-3" strokeWidth={3.5} />
                                                </motion.span>
                                            ) : active ? (
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                </span>
                                            ) : (
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            )}
                                        </div>

                                        <div
                                            className={`min-w-0 transition-opacity duration-300 ${complete || active ? "opacity-100" : "opacity-45"
                                                }`}
                                        >
                                            <p
                                                className={`text-[13px] font-semibold leading-snug ${active
                                                        ? "text-slate-900"
                                                        : complete
                                                            ? "text-slate-700"
                                                            : "text-slate-500"
                                                    }`}
                                            >
                                                {stage.title}
                                            </p>
                                            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">
                                                {stage.detail}
                                                <span className="sr-only">
                                                    {complete ? " — completed" : active ? " — in progress" : " — pending"}
                                                </span>
                                            </p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

                        {/* ── Progress ── */}
                        <div className="mt-6">
                            <div className="mb-2 flex items-baseline justify-between">
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${GeistMono.className}`}
                                >
                                    Analysis progress
                                </span>
                                <span
                                    className={`text-[13px] font-bold tabular-nums text-orange-600 ${GeistMono.className}`}
                                    aria-hidden="true"
                                >
                                    {displayPct}%
                                </span>
                            </div>

                            <div
                                className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={displayPct}
                                aria-label="Analysis progress"
                            >
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-[width] duration-100 ease-linear"
                                    style={{ width: `${displayPct}%` }}
                                />
                            </div>

                            <div className="mt-3 min-h-[38px]" aria-live="polite" aria-atomic="true">
                                <p className="text-[12px] font-semibold text-slate-700">
                                    {allDone ? "Analysis complete" : currentStage.title}
                                </p>
                                <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">
                                    {allDone
                                        ? "Opening your dashboard…"
                                        : currentStage.detail}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Honest caption */}
                    <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400/80">
                        Simulated demo analysis
                    </p>
                </motion.div>
            </div>
        </motion.div>
    )
}
