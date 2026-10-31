"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/authStore"
import { getUserProfile, updateUserProfile } from "@/lib/api"
import {
    Github, Linkedin, Sparkles, ExternalLink, RefreshCw, CheckCircle2,
    AlertCircle, Search, Layers, Box, Cpu, ArrowLeft, ArrowRight,
    LogOut, User, ShieldCheck, Code, Globe, Terminal, Award
} from "lucide-react"

const ease = [0.22, 1, 0.36, 1]
const pixel = "var(--font-pixel), monospace"
const editorial = "var(--font-editorial), 'Georgia', serif"

const CATEGORY_THEMES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    frontend: {
        label: "Frontend",
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        dot: "bg-orange-500",
    },
    backend: {
        label: "Backend",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
    },
    language: {
        label: "Language",
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
        dot: "bg-cyan-500",
    },
    devops: {
        label: "DevOps & Cloud",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
    },
    ml: {
        label: "AI / ML",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
    },
    database: {
        label: "Database",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
    },
    concept: {
        label: "Concept",
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-500",
    },
}

export default function ProfilePage() {
    const router = useRouter()
    const { user, setUser, logout } = useAuthStore()

    const [profileData, setProfileData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [selectedSource, setSelectedSource] = useState<string>("all")
    const [isEditingRole, setIsEditingRole] = useState(false)
    const [targetRoleInput, setTargetRoleInput] = useState("")
    const [savingRole, setSavingRole] = useState(false)

    // Load user profile on mount
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.replace("/login")
            return
        }

        getUserProfile()
            .then((data) => {
                setProfileData(data)
                setTargetRoleInput(data.target_role || user?.target_role || "Full Stack Developer")
                // Keep authStore user updated
                if (data.github_connected !== undefined || data.linkedin_connected !== undefined) {
                    setUser({
                        name: data.name || user?.name || "Developer",
                        username: data.username || data.uid || user?.username || "user",
                        email: data.email || user?.email || "",
                        avatar: data.avatar || user?.avatar || "",
                        target_role: data.target_role || user?.target_role || "Full Stack Developer",
                        auth_provider: data.auth_provider || user?.auth_provider || "google",
                        github_username: data.github_username || user?.github_username || "",
                        github_connected: Boolean(data.github_connected),
                        linkedin_connected: Boolean(data.linkedin_connected),
                        linkedin_username: data.linkedin_username || user?.linkedin_username || "",
                        onboarding_completed: Boolean(data.onboarding_completed),
                    })
                }
            })
            .catch((err) => {
                console.error("Error fetching user profile:", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [router, setUser])

    const handleSaveRole = async () => {
        if (!targetRoleInput.trim()) return
        setSavingRole(true)
        try {
            await updateUserProfile({ target_role: targetRoleInput.trim() })
            setProfileData((prev: any) => ({ ...prev, target_role: targetRoleInput.trim() }))
            if (user) {
                setUser({ ...user, target_role: targetRoleInput.trim() })
            }
            setIsEditingRole(false)
        } catch (err) {
            console.error("Failed to update role:", err)
        } finally {
            setSavingRole(false)
        }
    }

    const skills = useMemo(() => {
        return profileData?.skills || []
    }, [profileData])

    // Filter skills by search query, category, and source
    const filteredSkills = useMemo(() => {
        return skills.filter((s: any) => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
            const matchesCat = selectedCategory === "all" || s.category?.toLowerCase() === selectedCategory.toLowerCase()
            const matchesSource =
                selectedSource === "all" ||
                (selectedSource === "both" && s.source === "both") ||
                (selectedSource === "github" && (s.source === "github" || s.source === "both")) ||
                (selectedSource === "linkedin" && (s.source === "linkedin" || s.source === "both"))

            return matchesSearch && matchesCat && matchesSource
        })
    }, [skills, searchQuery, selectedCategory, selectedSource])

    const availableCategories = useMemo(() => {
        const set = new Set<string>()
        skills.forEach((s: any) => {
            if (s.category) set.add(s.category.toLowerCase())
        })
        return Array.from(set)
    }, [skills])

    const ghConnected = Boolean(profileData?.github_connected || user?.github_connected)
    const liConnected = Boolean(profileData?.linkedin_connected || user?.linkedin_connected)
    const ghUser = profileData?.github_username || profileData?.github_profile?.username || user?.github_username || ""
    const liUser = profileData?.linkedin_username || user?.linkedin_username || ""

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FCFCFD] flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Loading your PathForge profile…</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FCFCFD] selection:bg-orange-100 selection:text-orange-900 relative pb-20">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-50" />
            </div>

            {/* Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span
                                className="text-[17px] sm:text-[20px] font-bold tracking-tight text-[#F97316] transition-transform group-hover:scale-105"
                                style={{ fontFamily: pixel }}
                            >
                                PathForge
                            </span>
                        </Link>
                        <span className="text-slate-300 font-light">/</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700">Profile & Connected Accounts</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs sm:text-sm font-bold border border-orange-200 transition-colors shadow-2xs"
                        >
                            <Box className="w-4 h-4" />
                            <span>3D Graph</span>
                        </Link>
                        <button
                            onClick={() => {
                                logout()
                                router.push("/")
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
                {/* ── 1. USER IDENTITY HERO CARD ── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/80 mb-8 backdrop-blur-sm"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                {profileData?.avatar || user?.avatar ? (
                                    <img
                                        src={profileData?.avatar || user?.avatar}
                                        alt={profileData?.name || "User Avatar"}
                                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200"
                                    />
                                ) : (
                                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-orange-500/25">
                                        {(profileData?.name || user?.name || "U")[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center">
                                    <ShieldCheck className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            {/* User details */}
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {profileData?.name || user?.name || "Developer"}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                                        {profileData?.auth_provider === "google" ? "Google Account" : "GitHub Account"}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium mb-2">
                                    {profileData?.email || user?.email || "No email provided"}
                                </p>

                                {/* Target role editor */}
                                <div className="flex items-center gap-2">
                                    {isEditingRole ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={targetRoleInput}
                                                onChange={(e) => setTargetRoleInput(e.target.value)}
                                                placeholder="e.g. Full Stack Developer"
                                                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-orange-500 font-medium"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveRole}
                                                disabled={savingRole}
                                                className="px-2.5 py-1 text-xs bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                                            >
                                                {savingRole ? "Saving…" : "Save"}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingRole(false)}
                                                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold">
                                                <Award className="w-3.5 h-3.5 text-orange-500" />
                                                Target: {profileData?.target_role || "Full Stack Developer"}
                                            </span>
                                            <button
                                                onClick={() => setIsEditingRole(true)}
                                                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-start pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-lg sm:text-xl font-bold text-slate-900">{profileData?.total_skills || skills.length}</div>
                                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Skills Mapped</div>
                            </div>
                            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-lg sm:text-xl font-bold text-slate-900">{profileData?.total_repos || 0}</div>
                                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Repositories</div>
                            </div>
                            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                                <div className="text-lg sm:text-xl font-bold text-orange-600">{profileData?.total_nodes || skills.length}</div>
                                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Graph Nodes</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── 2. CONNECTED ACCOUNTS SECTION ── */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Connected Accounts</h2>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium">
                                Link your developer identities to keep your knowledge graph continuously synced.
                            </p>
                        </div>
                        <Link
                            href="/setup"
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                            <span>Manage Connections</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* GitHub Account Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease }}
                            className={`rounded-3xl p-6 border transition-all ${
                                ghConnected
                                    ? "bg-white border-slate-200 shadow-md shadow-slate-100"
                                    : "bg-slate-50/70 border-dashed border-slate-300"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                                        <Github className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">GitHub</h3>
                                        <p className="text-xs text-slate-500 font-medium">Code & Repository Analysis</p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        ghConnected
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${ghConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                                    {ghConnected ? "Connected" : "Not connected"}
                                </span>
                            </div>

                            {ghConnected ? (
                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-800">@{ghUser}</span>
                                        </div>
                                        <a
                                            href={`https://github.com/${ghUser}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-slate-500 hover:text-orange-600 inline-flex items-center gap-1 transition-colors"
                                        >
                                            View Profile <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>

                                    {profileData?.github_profile?.bio && (
                                        <p className="text-xs text-slate-600 italic px-1">
                                            &ldquo;{profileData.github_profile.bio}&rdquo;
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-slate-500 font-medium">
                                            {profileData?.github_profile?.public_repos || profileData?.total_repos || 0} public repos
                                            {profileData?.github_profile?.followers !== undefined && ` &bull; ${profileData.github_profile.followers} followers`}
                                        </div>
                                        <Link
                                            href="/setup"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Re-sync Repos
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                                        Connect your GitHub account to analyze all public repositories, frameworks, commits, and languages into your graph.
                                    </p>
                                    <Link
                                        href="/setup"
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
                                    >
                                        <Github className="w-3.5 h-3.5" /> Connect GitHub
                                    </Link>
                                </div>
                            )}
                        </motion.div>

                        {/* LinkedIn Account Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15, ease }}
                            className={`rounded-3xl p-6 border transition-all ${
                                liConnected
                                    ? "bg-white border-slate-200 shadow-md shadow-slate-100"
                                    : "bg-slate-50/70 border-dashed border-slate-300"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] text-white flex items-center justify-center shadow-sm">
                                        <Linkedin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">LinkedIn</h3>
                                        <p className="text-xs text-slate-500 font-medium">Experience & Skills Extraction</p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        liConnected
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${liConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                                    {liConnected ? "Connected" : "Not connected"}
                                </span>
                            </div>

                            {liConnected ? (
                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-bold text-blue-900">
                                                {liUser ? `@${liUser}` : "Profile Verified"}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-700">
                                            {(profileData?.linkedin_skills || []).length} AI-extracted skills
                                        </span>
                                    </div>

                                    {profileData?.linkedin_roles && profileData.linkedin_roles.length > 0 && (
                                        <div className="text-xs text-slate-600 px-1">
                                            <span className="font-semibold text-slate-700">Detected Roles:</span>{" "}
                                            {profileData.linkedin_roles.join(", ")}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-slate-500 font-medium">
                                            Synchronized into 3D Graph
                                        </div>
                                        <Link
                                            href="/setup"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Update Profile Text
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                                        Extract your industry skills, verified certifications, and career experience from your LinkedIn profile via AI.
                                    </p>
                                    <Link
                                        href="/setup"
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold text-xs shadow-sm transition-colors"
                                    >
                                        <Linkedin className="w-3.5 h-3.5" /> Connect LinkedIn
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* ── 3. SKILLS & KNOWLEDGE PORTFOLIO SECTION ── */}
                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                LIVING PORTFOLIO
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Skills & Competencies Inventory
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium">
                                Synthesized from your real Git repositories, AST code analysis, and LinkedIn profile credentials.
                            </p>
                        </div>

                        {/* Search & Source filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search skills…"
                                    className="pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-44 sm:w-56 shadow-2xs transition-all font-medium"
                                />
                            </div>

                            {/* Source toggle */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                                <button
                                    onClick={() => setSelectedSource("all")}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                                        selectedSource === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setSelectedSource("github")}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all ${
                                        selectedSource === "github" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                    title="GitHub verified"
                                >
                                    <Github className="w-3 h-3" />
                                    <span>Code</span>
                                </button>
                                <button
                                    onClick={() => setSelectedSource("linkedin")}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all ${
                                        selectedSource === "linkedin" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                    title="LinkedIn extracted"
                                >
                                    <Linkedin className="w-3 h-3" />
                                    <span>LinkedIn</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    {availableCategories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                            <button
                                onClick={() => setSelectedCategory("all")}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                    selectedCategory === "all"
                                        ? "bg-orange-500 text-white shadow-xs"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                            >
                                All Categories ({skills.length})
                            </button>
                            {availableCategories.map((cat) => {
                                const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.concept
                                const count = skills.filter((s: any) => s.category?.toLowerCase() === cat).length
                                const isActive = selectedCategory === cat
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                            isActive
                                                ? "bg-slate-900 text-white shadow-xs"
                                                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                                        <span>{theme.label}</span>
                                        <span className="text-[10px] opacity-70">({count})</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Skills Grid */}
                    {filteredSkills.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {filteredSkills.map((skill: any, idx: number) => {
                                const cat = (skill.category || "concept").toLowerCase()
                                const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.concept
                                const isBoth = skill.source === "both"
                                const isLi = skill.source === "linkedin"
                                const isGh = skill.source === "github" || (!isLi && !isBoth)

                                return (
                                    <motion.div
                                        key={skill.name + idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.4) }}
                                        whileHover={{ y: -2 }}
                                        className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate" title={skill.name}>
                                                    {skill.name}
                                                </h4>

                                                {/* Source Icon Badge */}
                                                <div className="shrink-0 flex items-center gap-1">
                                                    {isBoth ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold"
                                                            title="Verified on both GitHub and LinkedIn"
                                                        >
                                                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                                            Verified
                                                        </span>
                                                    ) : isLi ? (
                                                        <span
                                                            className="inline-flex items-center p-1 rounded-md bg-blue-50 text-[#0A66C2]"
                                                            title="Extracted from LinkedIn"
                                                        >
                                                            <Linkedin className="w-3 h-3" />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="inline-flex items-center p-1 rounded-md bg-slate-100 text-slate-700"
                                                            title="Verified from GitHub code"
                                                        >
                                                            <Github className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Category Tag */}
                                            <div className="mb-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${theme.bg} ${theme.text} ${theme.border} border`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                                                    {theme.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Repos footer if available */}
                                        {skill.repos && skill.repos.length > 0 && (
                                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                                                <span className="truncate">In: {skill.repos[0]}</span>
                                                {skill.repos.length > 1 && (
                                                    <span className="text-slate-500 font-semibold">+{skill.repos.length - 1}</span>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                                <Box className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                {searchQuery ? "No matching skills found" : "No skills mapped yet"}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
                                {searchQuery
                                    ? `No skills matched your search "${searchQuery}". Try a different keyword.`
                                    : "Connect your GitHub account or paste your LinkedIn credentials to automatically generate your verified skills inventory."}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/setup"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
                                >
                                    <Sparkles className="w-4 h-4" /> Connect Accounts Now
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* ── 4. CTA CALLOUT CARD ── */}
                <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-7 sm:p-9 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_right,rgba(249,115,22,0.15),transparent)] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-orange-400 text-xs font-bold mb-3">
                                <Sparkles className="w-3.5 h-3.5" />
                                3D EXPLORER
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                                Ready to explore your 3D Knowledge Graph?
                            </h3>
                            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
                                Navigate your interactive career solar system, filter repositories, unlock AI insights, and test against industry recruiter standards.
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-all whitespace-nowrap self-start sm:self-auto"
                        >
                            Open 3D Graph <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
