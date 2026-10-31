"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"

const CATEGORY_COLORS: Record<string, string> = {
    frontend:  "#F97316",
    backend:   "#3B82F6",
    ml:        "#8B5CF6",
    devops:    "#10B981",
    database:  "#F59E0B",
    mobile:    "#EC4899",
    concept:   "#64748B",
    language:  "#06B6D4",
}

interface Skill {
    name: string
    category: string
    maturity: number
    market_demand: number
}

interface ProfileData {
    username: string
    career_readiness: number
    total_skills: number
    total_repos: number
    avg_maturity: number
    avg_market_demand: number
    top_skills: Skill[]
    skill_distribution: Record<string, number>
    repos: string[]
    verified: boolean
    generated_at: number
}

export default function PublicProfilePage() {
    const params = useParams()
    const slug = params?.slug as string
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [error, setError] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!slug) return
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        fetch(`${apiUrl}/profile/${slug}`)
            .then(r => {
                if (!r.ok) throw new Error("Not found")
                return r.json()
            })
            .then(setProfile)
            .catch(() => setError(true))
    }, [slug])

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShareLinkedIn = () => {
        const url = encodeURIComponent(window.location.href)
        const text = encodeURIComponent(`Check out my developer skill profile — built from real GitHub code analysis with PathForge AI 🚀`)
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, "_blank")
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FCFCFD] flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                    <div className="text-5xl mb-4">🔭</div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
                    <p className="text-sm text-slate-500 mb-6">This profile link may have expired or doesn't exist.</p>
                    <a href="/" className="inline-block px-6 py-3 bg-[#F97316] text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors">
                        Analyze your GitHub →
                    </a>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#FCFCFD] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const scoreColor = profile.career_readiness >= 70 ? "#10B981" : profile.career_readiness >= 50 ? "#F59E0B" : "#EF4444"
    const circumference = 2 * Math.PI * 45
    const dashOffset = circumference - (profile.career_readiness / 100) * circumference

    return (
        <div className="min-h-screen bg-[#FCFCFD] font-sans">
            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
                <a href="/" className="text-sm sm:text-2xl font-bold text-[#F97316] font-pixel tracking-wider">PathForge</a>
                <span className="text-xs text-slate-400 font-medium hidden sm:block">AI-powered developer career intelligence</span>
                <a href="/" className="px-4 py-2 bg-[#F97316] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">
                    Analyze your repos →
                </a>
            </nav>

            <div className="max-w-3xl mx-auto pt-28 pb-16 px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        GitHub-Verified Skill Profile
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">@{profile.username}</h1>
                    <p className="text-slate-500 text-sm">
                        {profile.total_skills} skills extracted from {profile.total_repos} repositories
                    </p>
                </motion.div>

                {/* Score + Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
                >
                    {/* Career Readiness Ring */}
                    <div className="sm:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
                        <svg width="120" height="120" viewBox="0 0 100 100" className="mb-2">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                            <circle
                                cx="50" cy="50" r="45" fill="none"
                                stroke={scoreColor} strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90 50 50)"
                                style={{ transition: "stroke-dashoffset 1.2s ease" }}
                            />
                            <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="18" fontWeight="bold" fill={scoreColor}>
                                {profile.career_readiness.toFixed(0)}%
                            </text>
                        </svg>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Career Readiness</p>
                    </div>

                    {/* Stats */}
                    <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                        {[
                            { label: "Total Skills", value: profile.total_skills, suffix: "" },
                            { label: "Repos Analyzed", value: profile.total_repos, suffix: "" },
                            { label: "Avg Skill Maturity", value: profile.avg_maturity.toFixed(0), suffix: "%" },
                            { label: "Avg Market Demand", value: profile.avg_market_demand.toFixed(0), suffix: "%" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}{stat.suffix}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Top Skills</h2>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Ranked by Maturity</span>
                    </div>
                    <div className="space-y-3">
                        {profile.top_skills.map((skill, i) => (
                            <div key={skill.name} className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-300 w-4 text-right shrink-0">#{i + 1}</span>
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[skill.category] || "#64748B" }} />
                                <span className="text-sm font-bold text-slate-800 flex-1 min-w-0">{skill.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 shrink-0 hidden sm:block capitalize">{skill.category}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${skill.maturity}%`,
                                                backgroundColor: CATEGORY_COLORS[skill.category] || "#64748B"
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 w-8 text-right">{skill.maturity.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6"
                >
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">Skill Distribution</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(profile.skill_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, count]) => (
                                <div
                                    key={cat}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
                                    style={{
                                        backgroundColor: `${CATEGORY_COLORS[cat]}15`,
                                        borderColor: `${CATEGORY_COLORS[cat]}40`,
                                        color: CATEGORY_COLORS[cat] || "#64748B"
                                    }}
                                >
                                    <span className="capitalize">{cat}</span>
                                    <span className="opacity-70">{count}</span>
                                </div>
                            ))}
                    </div>
                </motion.div>

                {/* Verified badge + Share buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            <p className="text-sm font-bold text-slate-900">Verified by PathForge</p>
                        </div>
                        <p className="text-xs text-slate-500">Skills extracted from real GitHub code — not self-reported</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Generated {new Date(profile.generated_at * 1000).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            {copied ? "✓ Copied!" : "🔗 Copy Link"}
                        </button>
                        <button
                            onClick={handleShareLinkedIn}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white text-xs font-bold rounded-xl hover:bg-[#0958a8] transition-colors shadow-sm"
                        >
                            Share on LinkedIn
                        </button>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center mt-10"
                >
                    <p className="text-sm text-slate-500 mb-3">Want to generate your own verified developer profile?</p>
                    <a href="/" className="inline-block px-8 py-3 bg-[#F97316] text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors shadow-md">
                        Analyze Your GitHub for Free →
                    </a>
                </motion.div>
            </div>
        </div>
    )
}
