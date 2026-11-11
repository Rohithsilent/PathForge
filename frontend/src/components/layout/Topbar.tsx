"use client"
import { useRouter } from "next/navigation"
import { useGraphStore } from "@/stores/graphStore"
import { useAuthStore } from "@/stores/authStore"
import { useTourStore } from "@/stores/tourStore"
import { Button } from "@/components/ui/button"
import EngineToggle from "@/components/ui/EngineToggle"
import { useState, useRef, useEffect } from "react"

export default function Topbar() {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)
    const {
        marketOverlay, toggleMarketOverlay,
        recruiterMode, toggleRecruiterMode,
        showInsights, toggleInsights,
        copilotMode, toggleCopilotMode,
        roadmapMode, toggleRoadmapMode
    } = useGraphStore()
    const { startTour } = useTourStore()
    const { user } = useAuthStore()
    const displayName = user?.name || "Developer"
    const displayRole = user?.target_role ? `${user.target_role} track` : "Pro Member"

    // Handle clicks outside of profile dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            const originalOverflow = document.body.style.overflow
            const originalTouchAction = document.body.style.touchAction
            document.body.style.overflow = "hidden"
            document.body.style.touchAction = "none"
            return () => {
                document.body.style.overflow = originalOverflow
                document.body.style.touchAction = originalTouchAction
            }
        }
    }, [mobileMenuOpen])

    return (
        <>
            <div className="h-16 md:h-20 bg-transparent flex items-center justify-between px-4 md:px-8">
                {/* Logo Section */}
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <span className="text-[15px] md:text-[19px] font-bold text-[#F97316] block leading-none font-pixel tracking-wider">PathForge</span>
                    </button>
                </div>

                {/* Desktop Controls Bar */}
                <div id="tour-controls" className="hidden md:flex items-center gap-1 md:gap-2 bg-white border border-slate-200 shadow-sm rounded-xl px-2 py-1.5 justify-center">
                    <ToggleButton label="Insights" active={showInsights} onClick={toggleInsights} />
                    <ToggleButton label="Roadmap" shortLabel="Roadmap" active={roadmapMode} onClick={toggleRoadmapMode} />
                    <ToggleButton label="Market" shortLabel="Market" active={marketOverlay} onClick={toggleMarketOverlay} />
                    <ToggleButton label="Recruiter" shortLabel="Recruiter" active={recruiterMode} onClick={toggleRecruiterMode} />
                    <ToggleButton label="🤖 Copilot" shortLabel="Copilot" active={copilotMode} onClick={toggleCopilotMode} />
                    <div className="w-[1px] h-4 bg-slate-200 mx-1 md:mx-2 hidden sm:block" />
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/analytics")}
                        className="px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-bold text-slate-600 hover:text-[#F97316] uppercase tracking-wider h-auto"
                    >
                        Analytics
                    </Button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1 md:mx-2 hidden sm:block" />
                    <Button
                        variant="ghost"
                        onClick={startTour}
                        id="tour-trigger"
                        className="px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-bold text-orange-500 hover:text-orange-600 hover:bg-orange-50 uppercase tracking-wider h-auto gap-1"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Tour
                    </Button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1 md:mx-2 hidden sm:block" />
                    <EngineToggle />
                </div>

                {/* Desktop Profile Section */}
                <div id="tour-profile" className="hidden md:block relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 leading-none">{displayName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{displayRole}</p>
                        </div>
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={displayName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        )}
                        <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className={`text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-bold text-slate-900">{displayName}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{displayRole} · PathForge</p>
                            </div>
                            <div className="py-1">
                                <DropdownItem icon="user" label="My Profile & Skills" onClick={() => { setProfileOpen(false); router.push("/profile") }} />
                                <DropdownItem icon="link" label="Connect Accounts" onClick={() => { setProfileOpen(false); router.push("/setup") }} />
                                <DropdownItem icon="analytics" label="Analytics" onClick={() => { setProfileOpen(false); router.push("/dashboard/analytics") }} />
                                <DropdownItem icon="home" label="Back to Home" onClick={() => { setProfileOpen(false); router.push("/") }} />
                                <div className="h-px bg-slate-100 mx-3 my-1" />
                                <DropdownItem icon="logout" label="Sign Out" onClick={() => { useAuthStore.getState().logout(); try { localStorage.removeItem("token") } catch { /* ignore storage errors */ }; setProfileOpen(false); router.push("/") }} danger />
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm relative z-50"
                >
                    <div className="flex flex-col gap-[5px] items-center justify-center w-5">
                        <span className={`block h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                        <span className={`block h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 ${mobileMenuOpen ? "opacity-0 translate-x-2" : ""}`} />
                        <span className={`block h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                    </div>
                </button>
            </div>

            {/* Mobile Slide-down Menu */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity touch-none"
                        onClick={() => setMobileMenuOpen(false)}
                        onTouchMove={(e) => e.preventDefault()}
                    />
                    <div className="fixed top-[72px] left-4 right-4 max-h-[calc(100dvh-88px)] z-50 md:hidden bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-top-6 duration-200 overflow-y-auto overscroll-contain touch-pan-y">
                        <div className="p-5 space-y-4">
                            {/* Profile header */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100/60">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={displayName}
                                        referrerPolicy="no-referrer"
                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-inner shrink-0">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                                    <p className="text-[11px] text-slate-400 font-medium truncate">{displayRole} · PathForge</p>
                                </div>
                            </div>

                            {/* Panel toggles */}
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Panels</p>
                                <MobileMenuButton
                                    label="Insights"
                                    active={showInsights}
                                    onClick={() => { toggleInsights(); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="Career Roadmap"
                                    active={roadmapMode}
                                    onClick={() => { toggleRoadmapMode(); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="Market Analysis"
                                    active={marketOverlay}
                                    onClick={() => { toggleMarketOverlay(); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="Recruiter View"
                                    active={recruiterMode}
                                    onClick={() => { toggleRecruiterMode(); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="🤖 AI Copilot"
                                    active={copilotMode}
                                    onClick={() => { toggleCopilotMode(); setMobileMenuOpen(false) }}
                                />
                            </div>

                            {/* Navigation */}
                            <div className="space-y-1 pt-2 border-t border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Navigation</p>
                                <MobileMenuButton
                                    label="👤 My Profile & Skills"
                                    onClick={() => { router.push("/profile"); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="🔗 Connect Accounts"
                                    onClick={() => { router.push("/setup"); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="📊 Analytics"
                                    onClick={() => { router.push("/dashboard/analytics"); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="❓ Take Tour"
                                    onClick={() => { startTour(); setMobileMenuOpen(false) }}
                                />
                                <MobileMenuButton
                                    label="🏠 Back to Home"
                                    onClick={() => { router.push("/"); setMobileMenuOpen(false) }}
                                />
                            </div>

                            {/* Sign out */}
                            <div className="pt-2">
                                <button
                                    onClick={() => { useAuthStore.getState().logout(); try { localStorage.removeItem("token") } catch { /* ignore storage errors */ }; setMobileMenuOpen(false); router.push("/") }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

function MobileMenuButton({
    label,
    active,
    onClick,
}: {
    label: string
    active?: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                active
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
        >
            <div className="flex items-center gap-2">
                <span>{label}</span>
            </div>
            {active !== undefined && (
                <span className={`w-2 h-2 rounded-full ${active ? "bg-orange-500" : "bg-slate-200"}`} />
            )}
        </button>
    )
}

function DropdownItem({
    icon,
    label,
    onClick,
    danger,
}: {
    icon: string
    label: string
    onClick: () => void
    danger?: boolean
}) {
    const icons: Record<string, JSX.Element> = {
        user: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
        link: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
        ),
        home: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        analytics: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        logout: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
        ),
    }

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium transition-colors text-left ${danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                }`}
        >
            {icons[icon]}
            {label}
        </button>
    )
}

function ToggleButton({
    label,
    shortLabel,
    active,
    onClick,
}: {
    label: string
    shortLabel?: string
    active: boolean
    onClick: () => void
}) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`px-2 md:px-4 py-1.5 text-[10px] md:text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider h-auto ${
                active ? "bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 hover:text-[#F97316]" : "text-slate-500 hover:text-slate-900"
                }`}
        >
            <span className="hidden sm:flex items-center gap-1.5">
                {label}
            </span>
            <span className="sm:hidden flex items-center gap-1">
                {shortLabel || label}
            </span>
        </Button>
    )
}
