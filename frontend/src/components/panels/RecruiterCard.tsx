"use client"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useGraphStore } from "@/stores/graphStore"
import { useSkillStore } from "@/stores/skillStore"
import { useAuthStore } from "@/stores/authStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import ScoreRing from "@/components/ui/ScoreRing"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function RecruiterCard() {
    const { graphData } = useGraphStore()
    const { currentScore, targetRole } = useSkillStore()
    const { user } = useAuthStore()
    const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "copied">("idle")
    const [shareError, setShareError] = useState(false)
    const [exporting, setExporting] = useState(false)

    const handleShareProfile = async () => {
        setShareStatus("loading")
        setShareError(false)
        try {
            const username = user?.username || "developer"
            const res = await api.post("/profile/generate", { username })
            const profileUrl = `${window.location.origin}/profile/${res.data.slug}`
            await copyToClipboard(profileUrl)
            setShareStatus("copied")
            setTimeout(() => setShareStatus("idle"), 3000)
        } catch (err) {
            setShareStatus("idle")
            setShareError(true)
            setTimeout(() => setShareError(false), 4000)
        }
    }

    const handleExportPDF = async () => {
        if (exporting) return
        setExporting(true)
        try {
            await exportPDF({
                name: user?.name || user?.username || "Developer",
                username: user?.username || "developer",
                targetRole,
            })
        } catch (err) {
            console.error("PDF export failed:", err)
        } finally {
            setExporting(false)
        }
    }

    const allNodes = graphData.nodes
    const skills = useMemo(() => allNodes.filter((n) => n.category !== "repo"), [allNodes])
    const repos = useMemo(() => allNodes.filter((n) => n.category === "repo"), [allNodes])

    const avgMaturity = useMemo(() => {
        if (skills.length === 0) return 0
        return Math.round(skills.reduce((s, n) => s + n.maturity, 0) / skills.length)
    }, [skills])

    const avgMarketFit = useMemo(() => {
        if (skills.length === 0) return 0
        return Math.round(skills.reduce((s, n) => s + n.market_demand, 0) / skills.length)
    }, [skills])

    const projectDepth = useMemo(() => Math.min(100, repos.length * 10), [repos])

    const sources = useMemo(() => {
        const s = new Set(allNodes.map((n) => n.source).filter(Boolean))
        return s.size
    }, [allNodes])

    const radarData = useMemo(() => {
        const categories: Record<string, { total: number; count: number }> = {}
        for (const s of skills) {
            if (!categories[s.category]) categories[s.category] = { total: 0, count: 0 }
            categories[s.category].total += s.maturity
            categories[s.category].count++
        }
        return Object.entries(categories)
            .map(([cat, d]) => ({
                axis: cat.charAt(0).toUpperCase() + cat.slice(1),
                value: Math.round(d.total / d.count),
                color: CATEGORY_COLORS[cat] || "#64748B",
            }))
            .sort((a, b) => b.value - a.value)
    }, [skills])

    const topSkills = useMemo(() => {
        return [...skills].sort((a, b) => b.maturity - a.maturity).slice(0, 8)
    }, [skills])

    const riskAreas = useMemo(() => {
        const risks: string[] = []
        const catAvg: Record<string, number> = {}
        for (const r of radarData) catAvg[r.axis.toLowerCase()] = r.value
        if (!catAvg["devops"] || catAvg["devops"] < 50) risks.push("No DevOps skills")
        if (!catAvg["database"] || catAvg["database"] < 50) risks.push("Weak in Databases")
        if (!catAvg["ml"] || catAvg["ml"] < 40) risks.push("Limited ML/AI exposure")
        if (repos.length < 3) risks.push("Few public projects")
        if (skills.length < 5) risks.push("Narrow skill range")
        const lowDemand = skills.filter((s) => s.market_demand < 50)
        if (lowDemand.length > skills.length * 0.3) risks.push("Many low-demand skills")
        return risks
    }, [radarData, repos, skills])

    if (skills.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-sm font-bold text-slate-900">No data for recruiter view</p>
                <p className="text-xs text-slate-400 mt-1">Analyze a repository to generate your profile</p>
            </div>
        )
    }

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-4 p-4 bg-white border-l border-slate-200 overflow-y-auto"
            id="recruiter-card"
        >
            {/* Header */}
            <motion.div variants={fadeUp} className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-orange-500 uppercase tracking-[0.2em]">
                    Recruiter View
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={exporting}
                    data-pdf-hide
                    className="text-[10px] font-bold h-7 border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200"
                >
                    {exporting ? "Exporting…" : "Export PDF"}
                </Button>
            </motion.div>

            {/* Profile Summary */}
            <motion.div variants={fadeUp}>
                <Card className="p-4 space-y-1 bg-gradient-to-r from-slate-50 to-orange-50/30 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {repos.length}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                {user?.name || user?.username || "Developer"} · {repos.length} Projects · {skills.length} Skills
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">
                                Target: {targetRole}
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Share profile — primary CTA */}
            <motion.div variants={fadeUp}>
                <button
                    type="button"
                    onClick={handleShareProfile}
                    disabled={shareStatus === "loading"}
                    data-pdf-hide
                    className="group w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
                >
                    {shareStatus === "loading" ? (
                        <svg className="w-5 h-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                        </svg>
                    ) : shareStatus === "copied" ? (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <path d="m22 4-10 10.01-3-3" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    )}
                    <span className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-bold">
                            {shareStatus === "copied"
                                ? "✓ Link copied to clipboard"
                                : shareStatus === "loading"
                                    ? "Generating link…"
                                    : "Share public profile"}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-50/90">
                            {shareStatus === "copied"
                                ? "Paste it anywhere to share"
                                : shareStatus === "loading"
                                    ? "Creating your recruiter link"
                                    : "Copy a recruiter-ready link"}
                        </span>
                    </span>
                </button>
            </motion.div>

            {shareError && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-medium text-red-600 -mt-2"
                >
                    Share failed — make sure you have graph data first.
                </motion.p>
            )}

            {/* Score Rings */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
                <div className="flex justify-center">
                    <ScoreRing score={currentScore || 0} label="Readiness" color="#0891B2" size={80} />
                </div>
                <div className="flex justify-center">
                    <ScoreRing score={avgMaturity} label="Maturity" color="#059669" size={80} />
                </div>
            </motion.div>

            {/* Metrics */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                <MetricCard label="Project Depth" value={`${projectDepth}%`} />
                <MetricCard label="Market Fit" value={`${avgMarketFit}%`} />
                <MetricCard label="Total Skills" value={String(skills.length)} />
                <MetricCard label="Data Sources" value={String(sources)} />
            </motion.div>

            {/* Skill Radar by Category */}
            <motion.div variants={fadeUp} data-pdf-section className="space-y-3 pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Skill Radar
                </p>
                {radarData.map((item, i) => (
                    <div key={item.axis} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">{item.axis}</span>
                            <span className="text-slate-900">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Top Skills */}
            <motion.div variants={fadeUp} data-pdf-section className="space-y-2 pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Top Skills
                </p>
                {topSkills.map((skill, i) => (
                    <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0"
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[skill.category] || "#64748B" }} />
                        <span className="text-xs font-bold text-slate-700 flex-1">{skill.name}</span>
                        <Badge variant="secondary" className="text-[10px] font-bold h-5 bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {skill.maturity}%
                        </Badge>
                    </motion.div>
                ))}
            </motion.div>

            {/* Risk Areas */}
            {riskAreas.length > 0 && (
                <motion.div variants={fadeUp} data-pdf-section className="space-y-2 pt-2">
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em]">
                        Risk Areas
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {riskAreas.map((risk) => (
                            <Badge key={risk} variant="destructive" className="px-2 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                                {risk}
                            </Badge>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Strengths */}
            {radarData.filter(r => r.value >= 60).length > 0 && (
                <motion.div variants={fadeUp} data-pdf-section className="space-y-2 pt-2">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em]">
                        ✓ Strengths
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {radarData.filter(r => r.value >= 60).map((r) => (
                            <Badge key={r.axis} className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100">
                                Strong {r.axis} ({r.value}%)
                            </Badge>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
        </div>
    )
}

async function copyToClipboard(text: string) {
    // Preferred: async Clipboard API (needs a secure context and permission).
    try {
        if (navigator.clipboard?.writeText) {
            // Some browsers leave this promise pending while waiting for a
            // permission decision — never block the UI on it.
            await Promise.race([
                navigator.clipboard.writeText(text),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Clipboard timeout")), 1500)
                ),
            ])
            return
        }
    } catch {
        // Fall through to the legacy copy path.
    }

    // Fallback: temporary textarea + execCommand("copy").
    let textarea: HTMLTextAreaElement | null = null
    try {
        textarea = document.createElement("textarea")
        textarea.value = text
        textarea.setAttribute("readonly", "")
        textarea.style.position = "fixed"
        textarea.style.top = "0"
        textarea.style.left = "-9999px"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        textarea.setSelectionRange(0, textarea.value.length)
        if (document.execCommand("copy")) return
    } catch {
        // Fall through to the manual prompt.
    } finally {
        if (textarea?.parentNode) textarea.parentNode.removeChild(textarea)
    }

    // Last resort: let the user copy the link by hand.
    window.prompt("Copy your profile link:", text)
}

function buildPDFHeader(meta: { name: string; username: string; targetRole: string }) {
    const header = document.createElement("div")
    header.style.cssText =
        "border-bottom:2px solid #F97316;padding-bottom:14px;margin-bottom:22px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;"

    const eyebrow = document.createElement("div")
    eyebrow.textContent = "PathForge — Recruiter Profile"
    eyebrow.style.cssText =
        "font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#F97316;"

    const name = document.createElement("div")
    name.textContent = meta.name
    name.style.cssText = "font-size:24px;font-weight:800;line-height:1.2;color:#0F172A;margin-top:8px;"

    const role = document.createElement("div")
    role.textContent = `Target role: ${meta.targetRole} · @${meta.username}`
    role.style.cssText = "font-size:12px;font-weight:600;color:#475569;margin-top:5px;"

    const date = document.createElement("div")
    date.textContent = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
    date.style.cssText = "font-size:11px;color:#64748B;margin-top:6px;"

    header.append(eyebrow, name, role, date)
    return header
}

async function exportPDF(meta: { name: string; username: string; targetRole: string }) {
    const { default: html2canvas } = await import("html2canvas")
    const { jsPDF } = await import("jspdf")

    const live = document.getElementById("recruiter-card")
    if (!live) return

    // The panel animates scores and bars on mount. Wait for those to settle
    // so a quick click on Export captures final values, not mid-count ones.
    await new Promise((resolve) => setTimeout(resolve, 1800))

    // Render into an off-screen 800px container so the live 400px scroll
    // panel's height/overflow never clips the captured content.
    const container = document.createElement("div")
    container.style.cssText =
        "position:fixed;left:-10000px;top:0;width:800px;height:auto;overflow:visible;background:#fff;padding:32px;border:none;"

    const clone = live.cloneNode(true) as HTMLElement

    try {
        clone.removeAttribute("id")
        clone.style.width = "800px"
        clone.style.height = "auto"
        clone.style.maxHeight = "none"
        clone.style.minHeight = "0"
        clone.style.overflow = "visible"
        clone.style.padding = "0"
        clone.style.borderLeft = "none"
        clone.style.boxSizing = "border-box"

        // Drop controls that do not belong in the printed document.
        clone.querySelectorAll("[data-pdf-hide]").forEach((el) => el.remove())

        // Capture end-state styles in case a framer-motion element was
        // still holding an initial opacity of 0.
        clone.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
            if (el.style.opacity === "0") el.style.opacity = "1"
        })

        clone.insertBefore(buildPDFHeader(meta), clone.firstChild)

        container.appendChild(clone)
        document.body.appendChild(container)

        // Let layout and fonts settle before rasterising.
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Section offsets in canvas pixels (html2canvas runs at scale 2).
        const cloneRect = clone.getBoundingClientRect()
        const sectionTops = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-section]"))
            .map((el) => Math.round((el.getBoundingClientRect().top - cloneRect.top) * 2))
            .filter((y) => y > 0)

        const canvas = await html2canvas(clone, {
            backgroundColor: "#FFFFFF",
            scale: 2,
            useCORS: true,
            windowWidth: 800,
        })

        if (canvas.width === 0 || canvas.height === 0) return

        const pdf = new jsPDF("p", "mm", "a4")
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 10
        const contentWidth = pageWidth - margin * 2 // 190mm
        const footerY = pageHeight - 7 // ~290mm
        const contentHeight = pageHeight - margin * 2 // 277mm between margins

        // Slice the tall canvas into page-sized horizontal chunks. When a
        // page break would otherwise cut through a section, pull it back to
        // the nearest blank row so headings stay with their content.
        const pxPerMm = canvas.width / contentWidth
        const sliceHeightPx = Math.max(1, Math.floor(contentHeight * pxPerMm))
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        const isBlankRow = (y: number): boolean => {
            if (!ctx) return false
            const row = ctx.getImageData(0, y, canvas.width, 1).data
            // Sample every 4th pixel; treat near-white as blank.
            for (let x = 0; x < row.length; x += 16) {
                if (row[x] < 246 || row[x + 1] < 246 || row[x + 2] < 246) return false
            }
            return true
        }

        const findBlankBreak = (fromY: number, toY: number): number | null => {
            for (let y = Math.floor(toY); y >= Math.floor(fromY); y -= 4) {
                if (isBlankRow(y)) return y
            }
            return null
        }

        const breaks: Array<{ start: number; end: number }> = []
        let start = 0
        while (start < canvas.height) {
            let end = Math.min(start + sliceHeightPx, canvas.height)

            if (end < canvas.height) {
                // Prefer a clean break in the bottom third of the page.
                const blank = findBlankBreak(end - Math.floor(sliceHeightPx * 0.32), end)
                if (blank && blank > start + sliceHeightPx * 0.55) end = blank

                // Never leave a sliver of content alone on the final page.
                const remaining = canvas.height - end
                if (remaining > 0 && remaining < sliceHeightPx * 0.28) {
                    const rebalanced = findBlankBreak(
                        start + Math.floor(sliceHeightPx * 0.45),
                        canvas.height - Math.floor(sliceHeightPx * 0.32)
                    )
                    if (rebalanced) end = rebalanced
                }

                // Never end a page between a section heading and its rows:
                // if the break landed early inside a section, pull it back to
                // the gap before that section so the heading starts page N+1.
                const orphanedSection = sectionTops.find((top) => end > top && end < top + 260)
                if (orphanedSection !== undefined) {
                    const beforeHeading = findBlankBreak(
                        Math.max(start + 1, orphanedSection - 120),
                        orphanedSection
                    )
                    if (beforeHeading && beforeHeading > start + sliceHeightPx * 0.4) {
                        end = beforeHeading
                    }
                }
            }

            breaks.push({ start, end })
            start = end
        }

        breaks.forEach(({ start: sliceStart, end: sliceEnd }, page) => {
            if (page > 0) pdf.addPage()

            const sliceHeight = sliceEnd - sliceStart
            const slice = document.createElement("canvas")
            slice.width = canvas.width
            slice.height = sliceHeight

            const sliceCtx = slice.getContext("2d")
            if (!sliceCtx) throw new Error("Could not create canvas context for PDF page")

            sliceCtx.fillStyle = "#FFFFFF"
            sliceCtx.fillRect(0, 0, slice.width, slice.height)
            sliceCtx.drawImage(
                canvas,
                0,
                sliceStart,
                canvas.width,
                sliceHeight,
                0,
                0,
                canvas.width,
                sliceHeight
            )

            // JPEG keeps the exported file small without visible quality loss
            // at this resolution.
            pdf.addImage(
                slice.toDataURL("image/jpeg", 0.92),
                "JPEG",
                margin,
                margin,
                contentWidth,
                sliceHeight / pxPerMm
            )
        })

        // Footer (and a continuation label) on every page.
        const pageCount = pdf.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i)
            pdf.setFontSize(8)
            pdf.setTextColor(100, 116, 139) // slate-500
            if (i > 1) {
                pdf.text("PathForge · Recruiter Profile — continued", margin, 6)
            }
            pdf.text("PathForge · Recruiter Profile", margin, footerY)
            pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, {
                align: "right",
            })
        }

        pdf.save("PathForge-Recruiter-Profile.pdf")
    } finally {
        container.remove()
    }
}
