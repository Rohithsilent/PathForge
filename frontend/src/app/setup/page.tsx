"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/authStore"
import { useGraphStore } from "@/stores/graphStore"
import { analyzeGithubProfile, analyzeLinkedInProfile, getGithubUser, GitHubProfile, updateUserProfile } from "@/lib/api"
import {
    Github, Linkedin, ChevronRight, CheckCircle2, Loader2,
    AlertCircle, ExternalLink, Sparkles, ArrowRight, User
} from "lucide-react"

const ease = [0.22, 1, 0.36, 1]
const pixel = "var(--font-pixel), monospace"
const editorial = "var(--font-editorial), 'Georgia', serif"

export default function SetupPage() {
    const router = useRouter()
    const {
        user, setGithubProfile, updateGithubUsername, updateLinkedinUsername,
        setLinkedinConnected, setGithubConnected, setOnboardingCompleted
    } = useAuthStore()

    const [step, setStep] = useState<"github" | "linkedin" | "done">("github")

    // GitHub state
    const [ghUsername, setGhUsername] = useState("")
    const [ghStatus, setGhStatus] = useState<"idle" | "validating" | "analyzing" | "done" | "error">("idle")
    const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null)
    const [ghError, setGhError] = useState("")
    const [ghRepos, setGhRepos] = useState<any[]>([])
    const [ghNodes, setGhNodes] = useState(0)

    // LinkedIn state
    const [liUrl, setLiUrl] = useState("")
    const [liText, setLiText] = useState("")
    const [liStatus, setLiStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle")
    const [liResult, setLiResult] = useState<any>(null)
    const [liError, setLiError] = useState("")

    // Pre-fill GitHub username hint ONLY ON INITIAL MOUNT (prevents resetting after analysis!)
    const initialMountRef = useRef(false)
    useEffect(() => {
        if (initialMountRef.current) return
        const hint = user?.github_username || user?.github_username_hint
        if (hint) {
            initialMountRef.current = true
            setGhUsername(hint)
            getGithubUser(hint).then((p) => {
                setGhProfile(p)
            }).catch(() => {})
        }
    }, [user?.github_username, user?.github_username_hint])

    // Redirect to login if not authenticated
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) router.replace("/login")
    }, [router])

    // Validate GitHub username (live preview when typing)
    const validateGhTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handleGhUsernameChange = (val: string) => {
        setGhUsername(val)
        setGhProfile(null)
        setGhError("")
        setGhStatus("idle")
        if (validateGhTimeout.current) clearTimeout(validateGhTimeout.current)
        if (val.trim().length < 1) return
        validateGhTimeout.current = setTimeout(async () => {
            setGhStatus("validating")
            try {
                const profile = await getGithubUser(val.trim())
                setGhProfile(profile)
                setGhStatus("idle")
            } catch {
                setGhStatus("error")
                setGhError(`GitHub user "${val}" not found.`)
            }
        }, 600)
    }

    const handleAnalyzeGitHub = async () => {
        if (!ghUsername.trim()) return
        setGhStatus("analyzing")
        setGhError("")
        try {
            const result = await analyzeGithubProfile(ghUsername.trim())
            setGhProfile(result.profile)
            setGhRepos(result.repos)
            setGhNodes(result.nodes)

            // Cache graph into graphStore
            if (result.graph) {
                useGraphStore.getState().setGraphData(result.graph)
            }

            const profilePayload = {
                username: result.profile.username,
                avatar: result.profile.avatar,
                bio: result.profile.bio,
                followers: result.profile.followers,
                public_repos: result.profile.public_repos,
                html_url: result.profile.html_url,
            }

            setGithubProfile(profilePayload)
            updateGithubUsername(result.profile.username)
            setGithubConnected(true)
            setOnboardingCompleted(true)

            // Persist to backend & Firebase
            try {
                await updateUserProfile({
                    github_username: result.profile.username,
                    github_connected: true,
                    github_profile: profilePayload,
                    github_repos: result.repos || [],
                    onboarding_completed: true,
                })
            } catch (err) {
                console.warn("Failed to persist GitHub info to backend:", err)
            }

            setGhStatus("done")

            // Auto-advance to Step 2 (LinkedIn) after 1.5s
            setTimeout(() => {
                setStep("linkedin")
            }, 1500)
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Unknown error"
            setGhError(`Analysis failed: ${msg}`)
            setGhStatus("error")
        }
    }

    const handleAnalyzeLinkedIn = async () => {
        if (!liText.trim()) {
            setLiError("Please paste your LinkedIn profile text (About section, experience, skills).")
            return
        }
        setLiStatus("analyzing")
        setLiError("")
        try {
            const result = await analyzeLinkedInProfile(liText.trim(), liUrl.trim())
            setLiResult(result)

            if (result.graph) {
                useGraphStore.getState().setGraphData(result.graph)
            }

            if (result.extracted.username) {
                updateLinkedinUsername(result.extracted.username)
            }
            setLinkedinConnected(true)
            setOnboardingCompleted(true)

            // Persist to backend & Firebase
            try {
                await updateUserProfile({
                    linkedin_username: result.extracted.username || "",
                    linkedin_connected: true,
                    linkedin_skills: result.extracted.skills || [],
                    linkedin_roles: result.extracted.roles || [],
                    onboarding_completed: true,
                })
            } catch (err) {
                console.warn("Failed to persist LinkedIn info to backend:", err)
            }

            setLiStatus("done")

            // Auto-navigate to dashboard after 1.5s
            setTimeout(() => {
                router.push("/dashboard")
            }, 1500)
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Unknown error"
            setLiError(`Analysis failed: ${msg}`)
            setLiStatus("error")
        }
    }

    const handleSkipToDashboard = async () => {
        setOnboardingCompleted(true)
        try {
            await updateUserProfile({ onboarding_completed: true })
        } catch {}
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen bg-[#FCFCFD] flex flex-col justify-between selection:bg-orange-100 selection:text-orange-900 relative overflow-hidden">
            {/* SaaS Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
            </div>

            {/* Warm Radial Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
                <div
                    className="w-[700px] h-[500px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)", filter: "blur(80px)" }}
                />
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full max-w-6xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span
                        className="text-[17px] sm:text-[20px] font-bold tracking-tight text-[#F97316] transition-transform group-hover:scale-105"
                        style={{ fontFamily: pixel }}
                    >
                        PathForge
                    </span>
                </Link>

                {user && (
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-sm">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-orange-200 object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                                <User className="w-3.5 h-3.5" />
                            </div>
                        )}
                        <span className="text-xs font-bold text-slate-700">
                            {user.name || user.username}
                        </span>
                    </div>
                )}
            </header>

            {/* Main Center Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 py-4 sm:py-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease }}
                    className="flex flex-col items-center mb-8 text-center max-w-xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1.5 rounded-full border border-orange-200/70 bg-orange-50/60 text-orange-600 text-[12px] font-bold tracking-wide shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        PROFILE ONBOARDING &bull; STEP {step === "github" ? "1 OF 2" : "2 OF 2"}
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                        Set up your{" "}
                        <span style={{ fontFamily: editorial, fontStyle: "italic", color: "#F97316" }}>
                            profile
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
                        Connect your GitHub and LinkedIn to build a complete AI-powered knowledge graph of your skills.
                    </p>
                </motion.div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2.5 mb-8">
                    {[
                        { id: "github", label: "GitHub", icon: Github, isDone: ghStatus === "done" },
                        { id: "linkedin", label: "LinkedIn", icon: Linkedin, isDone: liStatus === "done" },
                    ].map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2.5">
                            <button
                                onClick={() => setStep(s.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                                    step === s.id
                                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                        : s.isDone
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                            : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                                }`}
                            >
                                <s.icon className="w-3.5 h-3.5" />
                                {s.label}
                                {s.isDone && (
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${step === s.id ? "text-white" : "text-emerald-500"}`} />
                                )}
                            </button>
                            {i < 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                        </div>
                    ))}
                </div>

                {/* Setup Cards Container */}
                <div className="w-full max-w-xl mx-auto">
                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: GITHUB ── */}
                        {step === "github" && (
                            <motion.div
                                key="github"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.4, ease }}
                                className="bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 rounded-3xl p-7 sm:p-9 backdrop-blur-sm"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
                                        <Github className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Connect GitHub Profile</h2>
                                        <p className="text-slate-500 text-xs font-medium">Analyze your public repositories to map all languages and skills</p>
                                    </div>
                                </div>

                                {/* Username input */}
                                <div className="mb-5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        GitHub Username
                                    </label>
                                    <div className="relative flex items-center rounded-2xl border-2 border-slate-200 hover:border-orange-300 focus-within:border-orange-500 focus-within:shadow-md focus-within:shadow-orange-100/60 transition-all bg-white overflow-hidden">
                                        <span className="pl-4 pr-1 text-slate-400 font-mono text-sm font-semibold select-none">
                                            github.com/
                                        </span>
                                        <input
                                            id="gh-username-input"
                                            type="text"
                                            value={ghUsername}
                                            onChange={(e) => handleGhUsernameChange(e.target.value)}
                                            placeholder="username"
                                            className="w-full py-3.5 pr-10 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none bg-transparent"
                                        />
                                        <div className="absolute right-3.5">
                                            {ghStatus === "validating" && (
                                                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                                            )}
                                            {ghProfile && ghStatus !== "analyzing" && (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Profile preview card */}
                                <AnimatePresence>
                                    {ghProfile && ghStatus !== "analyzing" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 shadow-sm">
                                                <img
                                                    src={ghProfile.avatar}
                                                    alt={ghProfile.name}
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-slate-900 font-bold text-sm truncate">
                                                            {ghProfile.name || ghProfile.username}
                                                        </p>
                                                        <span className="text-slate-400 text-xs font-mono">
                                                            @{ghProfile.username}
                                                        </span>
                                                    </div>
                                                    {ghProfile.bio && (
                                                        <p className="text-slate-600 text-xs line-clamp-1 mt-0.5 font-medium">
                                                            {ghProfile.bio}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700 font-bold text-[11px]">
                                                            {ghProfile.public_repos} repos
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700 font-bold text-[11px]">
                                                            {ghProfile.followers} followers
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={ghProfile.html_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white transition"
                                                    title="View on GitHub"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error alert */}
                                <AnimatePresence>
                                    {ghError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden"
                                        >
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                                <span>{ghError}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Done state notice */}
                                {ghStatus === "done" && (
                                    <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 shadow-sm">
                                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            GitHub profile analyzed successfully!
                                        </div>
                                        <p className="text-emerald-700 text-xs font-medium">
                                            {ghRepos.length} repositories analyzed &bull; {ghNodes} nodes generated in knowledge graph
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    {ghStatus !== "done" ? (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            id="analyze-github-btn"
                                            onClick={handleAnalyzeGitHub}
                                            disabled={!ghUsername.trim() || ghStatus === "analyzing" || ghStatus === "validating"}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {ghStatus === "analyzing" ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing repositories… (please wait)</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> Analyze GitHub Profile</>
                                            )}
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setStep("linkedin")}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all"
                                        >
                                            Continue to LinkedIn <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    )}

                                    <button
                                        onClick={() => setStep("linkedin")}
                                        className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm"
                                    >
                                        Skip
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: LINKEDIN ── */}
                        {step === "linkedin" && (
                            <motion.div
                                key="linkedin"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.4, ease }}
                                className="bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 rounded-3xl p-7 sm:p-9 backdrop-blur-sm"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-[#0077b5] flex items-center justify-center text-white shadow-md shadow-[#0077b5]/20">
                                        <Linkedin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Connect LinkedIn Profile</h2>
                                        <p className="text-slate-500 text-xs font-medium">Paste your profile text to extract verified skills and experience</p>
                                    </div>
                                </div>

                                {/* LinkedIn URL (optional) */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        LinkedIn Profile URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                    </label>
                                    <input
                                        id="li-url-input"
                                        type="url"
                                        value={liUrl}
                                        onChange={(e) => setLiUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/your-profile"
                                        className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-orange-300 focus:border-orange-500 focus:outline-none text-slate-900 text-sm font-semibold placeholder:text-slate-400 transition-all bg-white"
                                    />
                                </div>

                                {/* Text Paste */}
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Paste Profile Content <span className="text-orange-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400 font-medium font-mono">
                                            {liText.length} chars
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-xs mb-2.5 font-medium">
                                        Copy and paste your LinkedIn <strong>About section</strong>, <strong>Experience descriptions</strong>, or <strong>Skills list</strong>:
                                    </p>
                                    <textarea
                                        id="li-text-input"
                                        value={liText}
                                        onChange={(e) => {
                                            setLiText(e.target.value)
                                            setLiError("")
                                        }}
                                        placeholder="Full Stack Software Engineer with expertise in Python, React, Next.js, and cloud systems...&#10;Experience: Developed distributed APIs, built responsive interfaces...&#10;Skills: TypeScript, Tailwind CSS, PostgreSQL, Docker..."
                                        rows={6}
                                        className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-orange-300 focus:border-orange-500 focus:outline-none text-slate-900 text-sm placeholder:text-slate-400 transition-all bg-white resize-none font-medium leading-relaxed"
                                    />
                                </div>

                                {/* Error alert */}
                                <AnimatePresence>
                                    {liError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden"
                                        >
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                                <span>{liError}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Done state notice */}
                                {liStatus === "done" && liResult && (
                                    <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 shadow-sm">
                                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            LinkedIn skills extracted and merged!
                                        </div>
                                        <p className="text-emerald-700 text-xs font-medium mb-2.5">
                                            {liResult.extracted.skills.length} skills recognized &bull; {liResult.new_nodes} nodes added to knowledge graph
                                        </p>
                                        {liResult.extracted.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {liResult.extracted.skills.slice(0, 8).map((s: any) => {
                                                    const skillName = typeof s === "object" ? s.name : String(s)
                                                    return (
                                                        <span key={skillName} className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800 font-semibold shadow-2xs">
                                                            {skillName}
                                                        </span>
                                                    )
                                                })}
                                                {liResult.extracted.skills.length > 8 && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100/60 text-emerald-800 font-medium">
                                                        +{liResult.extracted.skills.length - 8} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    {liStatus !== "done" ? (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            id="analyze-linkedin-btn"
                                            onClick={handleAnalyzeLinkedIn}
                                            disabled={liStatus === "analyzing" || liText.trim().length < 15}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {liStatus === "analyzing" ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Extracting skills with AI…</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" /> Extract & Merge Skills</>
                                            )}
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => router.push("/dashboard")}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all"
                                        >
                                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    )}

                                    <button
                                        onClick={handleSkipToDashboard}
                                        className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm"
                                    >
                                        Skip to Dashboard
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Subtle Footer */}
            <footer className="relative z-10 py-6 text-center text-xs text-slate-400 font-medium">
                &copy; {new Date().getFullYear()} PathForge &bull; Your skills mapped as a living knowledge graph
            </footer>
        </div>
    )
}
