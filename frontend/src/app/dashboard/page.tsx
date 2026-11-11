"use client"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { useGraphStore } from "@/stores/graphStore"
import { useSkillStore } from "@/stores/skillStore"
import { useAuthStore } from "@/stores/authStore"
import { getUserProfile, getGraphData, getCareerReadiness, updateUserProfile } from "@/lib/api"
import { CATEGORY_COLORS } from "@/lib/mock-data"
import Topbar from "@/components/layout/Topbar"
import DashboardTour from "@/components/layout/DashboardTour"
import InsightPanel from "@/components/panels/InsightPanel"
import MarketAnalysisPanel from "@/components/panels/MarketAnalysisPanel"
import RecruiterCard from "@/components/panels/RecruiterCard"
import CopilotPanel from "@/components/panels/CopilotPanel"
import RoadmapPanel from "@/components/panels/RoadmapPanel"
import SearchFilter from "@/components/panels/SearchFilter"
import PanelSkeleton from "@/components/ui/PanelSkeleton"
import GraphFilters from "@/components/graph/GraphFilters"
import { motion, AnimatePresence } from "framer-motion"
import { Github, Linkedin, ExternalLink, Users, BookOpen } from "lucide-react"

// Dynamic import — 3d-force-graph cannot run on server
const KnowledgeGraph3D = dynamic(
    () => import("@/components/graph/KnowledgeGraph3D"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center w-full h-full bg-[#F8F9FA]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-mono text-slate-400">Building your graph...</p>
                </div>
            </div>
        ),
    }
)

function DashboardContent() {
    const searchParams = useSearchParams()
    const isDemo = searchParams.get("demo") === "true"
    const { setGraphData, graphData, showInsights, marketOverlay, recruiterMode, copilotMode, roadmapMode, activeRepos, filterSource, webglSupported } = useGraphStore()
    const { setCurrentScore, setGaps, setTargetRole } = useSkillStore()
    const { setUser, setIsDemo, user, githubProfile } = useAuthStore()

    const [panelLoading, setPanelLoading] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)
    const [backendDown, setBackendDown] = useState(false)
    const panelKey = `${showInsights}-${marketOverlay}-${recruiterMode}-${copilotMode}-${roadmapMode}`

    // Show skeleton briefly when switching panels
    useEffect(() => {
        setPanelLoading(true)
        const timer = setTimeout(() => setPanelLoading(false), 400)
        return () => clearTimeout(timer)
    }, [panelKey])

    useEffect(() => {
        setIsDemo(isDemo)

        // Demo mode uses the sample student profile so the topbar, recruiter
        // view and exported PDF all tell the same story as the graph.
        if (isDemo) {
            setUser({
                name: "Tony Stark",
                username: "tonystark",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TonyStark&facialHair=beardLight&facialHairProbability=100&hairColor=2c1b18&facialHairColor=2c1b18&accessories=sunglasses&accessoriesProbability=100&backgroundColor=ffedd5",
                target_role: "ML Engineer",
            })
            setTargetRole("ML Engineer")
        } else {
            // Rehydrate full authenticated user profile and knowledge graph from backend
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
            if (token) {
                getUserProfile()
                    .then((profile) => {
                        if (!profile) return
                        setUser({
                            name: profile.name || user?.name || "Developer",
                            username: profile.username || profile.uid || user?.username || "user",
                            email: profile.email || user?.email || "",
                            avatar: profile.avatar || user?.avatar || "",
                            target_role: profile.target_role || user?.target_role || "Full Stack Developer",
                            auth_provider: profile.auth_provider || user?.auth_provider || "google",
                            github_username: profile.github_username || user?.github_username || "",
                            github_connected: Boolean(profile.github_connected),
                            linkedin_connected: Boolean(profile.linkedin_connected),
                            linkedin_username: profile.linkedin_username || user?.linkedin_username || "",
                            leetcode_username: profile.leetcode_username || user?.leetcode_username || "",
                            leetcode_connected: Boolean(profile.leetcode_connected),
                            leetcode_stats: profile.leetcode_stats || user?.leetcode_stats || null,
                            resume_connected: Boolean(profile.resume_connected),
                            resume_filename: profile.resume_filename || user?.resume_filename || "",
                            resume_skills: profile.resume_skills || user?.resume_skills || [],
                            onboarding_completed: Boolean(profile.onboarding_completed),
                        })
                        if (profile.github_profile) {
                            useAuthStore.getState().setGithubProfile(profile.github_profile)
                        }
                        if (profile.target_role) {
                            setTargetRole(profile.target_role)
                        }
                        if (profile.graph && profile.graph.nodes && profile.graph.nodes.length > 0) {
                            setGraphData(profile.graph)
                        }
                    })
                    .catch((err) => {
                        console.warn("Could not rehydrate user profile on dashboard:", err)
                    })
            }
        }

        // Prevent hydration flash on mobile, close default insights
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 1024 && useGraphStore.getState().showInsights) {
                useGraphStore.setState({ showInsights: false })
            }
            setIsHydrated(true)
        }

        // Fetch real graph data from backend
        const fetchGraph = async () => {
            try {
                const data = await getGraphData(isDemo)
                setBackendDown(false)
                if (data.nodes && data.nodes.length > 0) {
                    setGraphData(data)
                } else if (!isDemo) {
                    // Check if store already has a cached graph
                    const cached = useGraphStore.getState().graphData
                    if (cached && cached.nodes && cached.nodes.length > 0) {
                        // Sync cached graph back to backend
                        updateUserProfile({ graph: cached }).catch(() => {})
                    }
                }
            } catch (err) {
                setBackendDown(true)
                console.warn('Could not fetch graph data:', err)
            }
        }

        // Fetch career readiness + skill gaps
        const fetchCareer = async () => {
            try {
                const role = isDemo ? "ML Engineer" : (useAuthStore.getState().user?.target_role || "Full Stack Developer")
                const data = await getCareerReadiness({
                    target_role: role,
                    provider: useGraphStore.getState().analysisEngine,
                })
                if (data) {
                    setCurrentScore(data.career_readiness)
                    setGaps(data.gaps || [])
                }
            } catch (err) {
                console.warn('Could not fetch career data:', err)
            }
        }

        fetchGraph()
        fetchCareer()
    }, [setIsDemo, setUser, setTargetRole, setGraphData, setCurrentScore, setGaps, isDemo])

    const panelOpen = showInsights || marketOverlay || recruiterMode || copilotMode || roadmapMode

    return (
        <div className="flex flex-col h-screen bg-[#F8F9FA]">
            <Topbar />
            <DashboardTour />
            <div className="flex flex-1 overflow-hidden px-4 md:px-8 pb-4 md:pb-8 gap-4 md:gap-6 relative">
                {/* Graph column — backend warning banner + 3D graph */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
                    {/* GitHub Profile Banner */}
                    {githubProfile && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-sm shrink-0 overflow-hidden"
                        >
                            <img
                                src={githubProfile.avatar}
                                alt={githubProfile.username}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full border border-slate-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{githubProfile.username}</p>
                                {githubProfile.bio && (
                                    <p className="text-[10px] text-slate-400 truncate">{githubProfile.bio}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <BookOpen className="w-3 h-3" />{githubProfile.public_repos} repos
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Users className="w-3 h-3" />{githubProfile.followers}
                                </span>
                                <a
                                    href={githubProfile.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-white transition"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {/* Graph Filters Bar */}
                    <div className="shrink-0">
                        <GraphFilters />
                    </div>

                    {backendDown && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-sm shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span className="text-[10px] md:text-[11px] font-semibold truncate">
                                    Backend unreachable — start the API on port 8000.
                                </span>
                            </div>
                            <button
                                onClick={() => setBackendDown(false)}
                                aria-label="Dismiss backend warning"
                                className="w-6 h-6 flex items-center justify-center rounded-full text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    {/* 3D Graph / 2D Node Map — takes remaining width */}
                    <div id="tour-graph" className="flex-1 min-h-0 relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        {webglSupported !== false && <SearchFilter variant="floating" />}
                        <KnowledgeGraph3D />

                        {/* Legend — only floating in 3D mode where nodes don't have text labels */}
                        {webglSupported !== false && (
                            <div id="tour-legend" className="absolute bottom-4 md:bottom-6 left-4 md:left-6 z-10 bg-white/80 backdrop-blur-md rounded-xl p-2 md:p-3 border border-slate-100 flex gap-2 md:gap-4 shadow-sm flex-wrap">
                                {[
                                    { label: "Repo", color: CATEGORY_COLORS.repo },
                                    { label: "Language", color: CATEGORY_COLORS.language },
                                    { label: "Concept", color: CATEGORY_COLORS.concept },
                                    { label: "Frontend", color: CATEGORY_COLORS.frontend },
                                    { label: "Backend", color: CATEGORY_COLORS.backend },
                                    { label: "ML/AI", color: CATEGORY_COLORS.ml },
                                    { label: "DevOps", color: CATEGORY_COLORS.devops },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-1 md:gap-1.5">
                                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel — desktop: side panel, mobile/tablet: overlay */}
                <AnimatePresence initial={false}>
                    {isHydrated && panelOpen && (
                        <>
                            {/* Mobile/tablet backdrop overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                                onClick={() => {
                                    if (showInsights) useGraphStore.getState().toggleInsights()
                                    if (marketOverlay) useGraphStore.getState().toggleMarketOverlay()
                                    if (recruiterMode) useGraphStore.getState().toggleRecruiterMode()
                                    if (copilotMode) useGraphStore.getState().toggleCopilotMode()
                                    if (roadmapMode) useGraphStore.getState().toggleRoadmapMode()
                                }}
                            />

                            {/* Panel — fixed on mobile, side panel on desktop */}
                            <motion.div
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "100%", opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="
                                    fixed right-0 top-0 bottom-0 w-full z-40
                                    lg:relative lg:right-auto lg:top-auto lg:bottom-auto lg:w-[400px] lg:z-auto
                                    overflow-y-auto bg-white border border-slate-200 lg:rounded-2xl shadow-lg lg:shadow-sm
                                "
                            >
                                {/* Mobile Panel Header with Close Button */}
                                <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-50">
                                    <span className="text-sm font-bold text-slate-900">
                                        {copilotMode ? "AI Copilot" : recruiterMode ? "Recruiter View" : marketOverlay ? "Market Analysis" : roadmapMode ? "Career Roadmap" : "Insights"}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            if (showInsights) useGraphStore.getState().toggleInsights()
                                            if (marketOverlay) useGraphStore.getState().toggleMarketOverlay()
                                            if (recruiterMode) useGraphStore.getState().toggleRecruiterMode()
                                            if (copilotMode) useGraphStore.getState().toggleCopilotMode()
                                            if (roadmapMode) useGraphStore.getState().toggleRoadmapMode()
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 transition-colors"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                <div className="min-w-0 lg:min-w-[400px] pb-8 lg:pb-0">
                                    {panelLoading ? <PanelSkeleton /> : copilotMode ? <CopilotPanel /> : recruiterMode ? <RecruiterCard /> : marketOverlay ? <MarketAnalysisPanel /> : roadmapMode ? <RoadmapPanel /> : <InsightPanel />}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default function Dashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center w-screen h-screen bg-[#F8F9FA]">
                <div className="w-8 h-8 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
