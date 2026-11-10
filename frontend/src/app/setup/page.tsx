"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/authStore"
import { useGraphStore } from "@/stores/graphStore"
import {
    analyzeGithubProfile, analyzeLinkedInProfile, getGithubUser,
    GitHubProfile, updateUserProfile, analyzeLeetCode, uploadResume, analyzeResumeText
} from "@/lib/api"
import {
    Github, Linkedin, ChevronRight, CheckCircle2, Loader2,
    AlertCircle, ExternalLink, Sparkles, ArrowRight, User,
    Code2, FileText, UploadCloud
} from "lucide-react"

const ease = [0.22, 1, 0.36, 1]
const pixel = "var(--font-pixel), monospace"
const editorial = "var(--font-editorial), 'Georgia', serif"

export default function SetupPage() {
    const router = useRouter()
    const {
        user, setGithubProfile, updateGithubUsername, updateLinkedinUsername,
        updateLeetCodeUsername, setLeetCodeConnected, setResumeConnected,
        setLinkedinConnected, setGithubConnected, setOnboardingCompleted
    } = useAuthStore()

    const [step, setStep] = useState<"github" | "leetcode" | "resume" | "linkedin" | "done">("github")

    // GitHub state
    const [ghUsername, setGhUsername] = useState("")
    const [ghStatus, setGhStatus] = useState<"idle" | "validating" | "analyzing" | "done" | "error">("idle")
    const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null)
    const [ghError, setGhError] = useState("")
    const [ghRepos, setGhRepos] = useState<any[]>([])
    const [ghNodes, setGhNodes] = useState(0)

    // LeetCode state
    const [lcUsername, setLcUsername] = useState("")
    const [lcStatus, setLcStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle")
    const [lcStats, setLcStats] = useState<any>(null)
    const [lcError, setLcError] = useState("")

    // Resume state
    const [resumeMode, setResumeMode] = useState<"file" | "text">("file")
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [resumeText, setResumeText] = useState("")
    const [resumeStatus, setResumeStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle")
    const [resumeResult, setResumeResult] = useState<any>(null)
    const [resumeError, setResumeError] = useState("")

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

            // Auto-advance to Step 2 (LeetCode) after 1.5s
            setTimeout(() => {
                setStep("leetcode")
            }, 1500)
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Unknown error"
            setGhError(`Analysis failed: ${msg}`)
            setGhStatus("error")
        }
    }

    const handleAnalyzeLeetCode = async () => {
        if (!lcUsername.trim()) {
            setLcError("Please enter your LeetCode username.")
            return
        }
        setLcStatus("analyzing")
        setLcError("")
        try {
            const cleanUser = lcUsername.trim().replace(/^https?:\/\/(www\.)?leetcode\.com\//, "").replace(/\/$/, "")
            const result = await analyzeLeetCode(cleanUser)
            setLcStats(result)

            if (result.graph) {
                useGraphStore.getState().setGraphData(result.graph)
            }

            updateLeetCodeUsername(cleanUser)
            setLeetCodeConnected(true, result)
            setOnboardingCompleted(true)

            try {
                await updateUserProfile({
                    leetcode_username: cleanUser,
                    leetcode_connected: true,
                    leetcode_stats: result,
                    onboarding_completed: true,
                })
            } catch (err) {
                console.warn("Failed to persist LeetCode profile:", err)
            }

            setLcStatus("done")
            setTimeout(() => setStep("resume"), 1500)
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Failed to analyze LeetCode"
            setLcError(msg)
            setLcStatus("error")
        }
    }

    const handleAnalyzeResume = async () => {
        setResumeStatus("analyzing")
        setResumeError("")
        try {
            let result: any
            if (resumeMode === "file") {
                if (!resumeFile) {
                    setResumeError("Please select a PDF or text resume file.")
                    setResumeStatus("idle")
                    return
                }
                result = await uploadResume(resumeFile)
            } else {
                if (!resumeText.trim() || resumeText.trim().length < 25) {
                    setResumeError("Please paste your resume content with experience and skills.")
                    setResumeStatus("idle")
                    return
                }
                result = await analyzeResumeText(resumeText.trim())
            }

            setResumeResult(result)
            if (result.graph) {
                useGraphStore.getState().setGraphData(result.graph)
            }

            setResumeConnected(true, result.filename, result.skills)
            setOnboardingCompleted(true)

            try {
                await updateUserProfile({
                    resume_connected: true,
                    resume_filename: result.filename,
                    resume_skills: result.skills || [],
                    onboarding_completed: true,
                })
            } catch (err) {
                console.warn("Failed to persist Resume profile:", err)
            }

            setResumeStatus("done")
            setTimeout(() => setStep("linkedin"), 1500)
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Failed to parse resume"
            setResumeError(msg)
            setResumeStatus("error")
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
                        PROFILE ONBOARDING &bull; STEP {step === "github" ? "1 OF 4" : step === "leetcode" ? "2 OF 4" : step === "resume" ? "3 OF 4" : "4 OF 4"}
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                        Set up your{" "}
                        <span style={{ fontFamily: editorial, fontStyle: "italic", color: "#F97316" }}>
                            profile
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
                        Connect GitHub, LeetCode, Resume, and LinkedIn to build a complete AI-powered knowledge graph of your skills.
                    </p>
                </motion.div>

                {/* Step Indicators */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 mb-8">
                    {[
                        { id: "github", label: "GitHub", icon: Github, isDone: ghStatus === "done" },
                        { id: "leetcode", label: "LeetCode", icon: Code2, isDone: lcStatus === "done" },
                        { id: "resume", label: "Resume", icon: FileText, isDone: resumeStatus === "done" },
                        { id: "linkedin", label: "LinkedIn", icon: Linkedin, isDone: liStatus === "done" },
                    ].map((s, i) => (
                        <div key={s.id} className="flex items-center gap-1.5 sm:gap-2.5">
                            <button
                                onClick={() => setStep(s.id as any)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                                    step === s.id
                                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                        : s.isDone
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                            : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                                }`}
                            >
                                <s.icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{s.label}</span>
                                {s.isDone && (
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${step === s.id ? "text-white" : "text-emerald-500"}`} />
                                )}
                            </button>
                            {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
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
                                            onClick={() => setStep("leetcode")}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all"
                                        >
                                            Continue to LeetCode <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    )}

                                    <button
                                        onClick={() => setStep("leetcode")}
                                        className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm"
                                    >
                                        Skip
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: LEETCODE ── */}
                        {step === "leetcode" && (
                            <motion.div
                                key="leetcode"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.4, ease }}
                                className="bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 rounded-3xl p-7 sm:p-9 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                                        <Code2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Connect LeetCode Profile</h2>
                                        <p className="text-slate-500 text-xs font-medium">Verify your algorithmic problem-solving & data structure expertise</p>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        LeetCode Username or Profile URL
                                    </label>
                                    <div className="relative flex items-center rounded-2xl border-2 border-slate-200 hover:border-amber-300 focus-within:border-amber-500 focus-within:shadow-md focus-within:shadow-amber-100/60 transition-all bg-white overflow-hidden">
                                        <span className="pl-4 pr-1 text-slate-400 font-mono text-sm font-semibold select-none">
                                            leetcode.com/
                                        </span>
                                        <input
                                            id="lc-username-input"
                                            type="text"
                                            value={lcUsername}
                                            onChange={(e) => {
                                                setLcUsername(e.target.value)
                                                setLcError("")
                                            }}
                                            placeholder="username"
                                            className="w-full py-3.5 pr-10 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Error alert */}
                                <AnimatePresence>
                                    {lcError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden"
                                        >
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                                <span>{lcError}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Done state preview */}
                                {lcStatus === "done" && lcStats && (
                                    <div className="mb-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                LeetCode Profile Connected (@{lcStats.username})
                                            </div>
                                            <span className="text-xs font-semibold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                                                Rank: #{lcStats.ranking ? lcStats.ranking.toLocaleString() : "Active"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                                            <div className="p-2 rounded-xl bg-white border border-amber-100">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                                                <p className="text-sm font-bold text-slate-800">{lcStats.total_solved}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white border border-emerald-100">
                                                <p className="text-[10px] uppercase font-bold text-emerald-600">Easy</p>
                                                <p className="text-sm font-bold text-emerald-700">{lcStats.easy_solved}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white border border-amber-100">
                                                <p className="text-[10px] uppercase font-bold text-amber-600">Medium</p>
                                                <p className="text-sm font-bold text-amber-700">{lcStats.medium_solved}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white border border-red-100">
                                                <p className="text-[10px] uppercase font-bold text-red-600">Hard</p>
                                                <p className="text-sm font-bold text-red-700">{lcStats.hard_solved}</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-amber-800 font-medium">
                                            Mapped {lcStats.new_nodes_count} algorithmic concept nodes into your knowledge graph.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    {lcStatus !== "done" ? (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            id="analyze-leetcode-btn"
                                            onClick={handleAnalyzeLeetCode}
                                            disabled={lcStatus === "analyzing" || !lcUsername.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {lcStatus === "analyzing" ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Querying LeetCode GraphQL…</>
                                            ) : (
                                                <><Code2 className="w-4 h-4" /> Fetch & Verify LeetCode Stats</>
                                            )}
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setStep("resume")}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all"
                                        >
                                            Continue to Resume <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    )}

                                    <button
                                        onClick={() => setStep("resume")}
                                        className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm"
                                    >
                                        Skip
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 3: RESUME ── */}
                        {step === "resume" && (
                            <motion.div
                                key="resume"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.4, ease }}
                                className="bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 rounded-3xl p-7 sm:p-9 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Upload or Paste Resume</h2>
                                        <p className="text-slate-500 text-xs font-medium">Extract work experience, frameworks, and projects into verified nodes</p>
                                    </div>
                                </div>

                                {/* Mode toggle: Upload PDF vs Paste Text */}
                                <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                                    <button
                                        onClick={() => setResumeMode("file")}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            resumeMode === "file"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        Upload PDF (.pdf)
                                    </button>
                                    <button
                                        onClick={() => setResumeMode("text")}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            resumeMode === "text"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        Paste Resume Text
                                    </button>
                                </div>

                                {resumeMode === "file" ? (
                                    <div className="mb-5">
                                        <label
                                            htmlFor="resume-file-input"
                                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all text-center"
                                        >
                                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                                            {resumeFile ? (
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-700">{resumeFile.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{(resumeFile.size / 1024).toFixed(1)} KB &bull; Click to change</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Click to upload your resume (PDF)</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">PDF, TXT, or MD up to 10MB</p>
                                                </div>
                                            )}
                                            <input
                                                id="resume-file-input"
                                                type="file"
                                                accept=".pdf,.txt,.md"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setResumeFile(e.target.files[0])
                                                        setResumeError("")
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="mb-5">
                                        <textarea
                                            value={resumeText}
                                            onChange={(e) => {
                                                setResumeText(e.target.value)
                                                setResumeError("")
                                            }}
                                            placeholder="Paste your resume contents here (work history, skills, projects, tools)..."
                                            rows={5}
                                            className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 focus:outline-none text-slate-900 text-sm placeholder:text-slate-400 transition-all bg-white resize-none font-medium leading-relaxed"
                                        />
                                    </div>
                                )}

                                {/* Error alert */}
                                <AnimatePresence>
                                    {resumeError && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden"
                                        >
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                                <span>{resumeError}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Done state preview */}
                                {resumeStatus === "done" && resumeResult && (
                                    <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Resume Parsed & Verified ({resumeResult.filename})
                                        </div>
                                        <p className="text-xs text-emerald-700 font-medium mb-2">
                                            Extracted {resumeResult.total_extracted} technologies &bull; {resumeResult.new_nodes_count} new nodes added
                                        </p>
                                        {resumeResult.skills && resumeResult.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {resumeResult.skills.slice(0, 8).map((s: any) => (
                                                    <span key={s.name} className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800 font-semibold shadow-2xs">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    {resumeStatus !== "done" ? (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            id="analyze-resume-btn"
                                            onClick={handleAnalyzeResume}
                                            disabled={resumeStatus === "analyzing" || (resumeMode === "file" ? !resumeFile : resumeText.trim().length < 25)}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {resumeStatus === "analyzing" ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Parsing resume with AI…</>
                                            ) : (
                                                <><FileText className="w-4 h-4" /> Extract & Map Resume Skills</>
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

                        {/* ── STEP 4: LINKEDIN ── */}
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
