"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { signInWithGoogle, signInWithGoogleRedirect, getGoogleRedirectResult, onAuthUserChange, isFirebaseConfigured } from "@/lib/firebase"
import { authFirebase } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { Loader2, AlertCircle, Sparkles, Github, ArrowRight } from "lucide-react"

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
const GITHUB_REDIRECT_URI = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : ""

const pixel = "var(--font-pixel), monospace"
const editorial = "var(--font-editorial), 'Georgia', serif"

export default function LoginPage() {
    const router = useRouter()
    const { setUser, setIsDemo } = useAuthStore()
    const [loading, setLoading] = useState<"google" | "github" | null>(null)
    const [error, setError] = useState("")
    const firebaseAvailable = isFirebaseConfigured()

    const processUserLogin = async (idToken: string) => {
        const { access_token, user } = await authFirebase(idToken)
        localStorage.setItem("token", access_token)

        const isReturning = Boolean(
            user.onboarding_completed ||
            user.github_connected ||
            user.linkedin_connected
        )

        setUser({
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            target_role: user.target_role || "Full Stack Developer",
            auth_provider: "google",
            github_username: user.github_username || user.github_username_hint || "",
            github_connected: Boolean(user.github_connected),
            linkedin_connected: Boolean(user.linkedin_connected),
            linkedin_username: user.linkedin_username || "",
            onboarding_completed: isReturning,
        })
        setIsDemo(false)

        if (isReturning) {
            router.push("/dashboard")
        } else {
            router.push("/setup")
        }
    }

    // Process Google redirect result and listen to Firebase auth state
    useEffect(() => {
        let isMounted = true

        // 1. Primary listener: catches redirect sign-in as soon as Firebase finishes rehydrating!
        const unsubscribe = onAuthUserChange(async (firebaseUser) => {
            if (!isMounted || !firebaseUser) return
            const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
            if (!currentToken) {
                setLoading("google")
                try {
                    const idToken = await firebaseUser.getIdToken()
                    await processUserLogin(idToken)
                } catch (err: any) {
                    console.error("Auto login error:", err)
                    if (isMounted) {
                        setError(`Sign-in failed: ${err.message || "Failed to authenticate"}`)
                        setLoading(null)
                    }
                }
            }
        })

        // 2. Also process getGoogleRedirectResult if available
        getGoogleRedirectResult()
            .then(async (result) => {
                if (result && isMounted) {
                    setLoading("google")
                    const idToken = await result.user.getIdToken()
                    await processUserLogin(idToken)
                }
            })
            .catch((err: any) => {
                console.error("Google redirect result error:", err)
                if (err.code !== "auth/popup-closed-by-user" && isMounted) {
                    setError(`Google sign-in error: ${err.message || "Failed to complete sign-in"}`)
                    setLoading(null)
                }
            })

        return () => {
            isMounted = false
            unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            const currentUser = useAuthStore.getState().user
            if (currentUser?.onboarding_completed || currentUser?.github_connected || currentUser?.linkedin_connected) {
                router.replace("/dashboard")
            } else {
                router.replace("/setup")
            }
        }
    }, [router])

    const handleGoogleLogin = async () => {
        if (!firebaseAvailable) {
            setError("Firebase is not configured. Please add your Firebase environment variables.")
            return
        }
        setLoading("google")
        setError("")
        try {
            const result = await signInWithGoogle()
            const idToken = await result.user.getIdToken()
            await processUserLogin(idToken)
        } catch (err: any) {
            console.error("Google login failed", err)
            if (err.code === "auth/popup-blocked") {
                // Pop-up blocked by browser, ad-blocker, or cross-origin restrictions — smoothly fallback to redirect
                setError("Pop-up blocked by browser. Redirecting directly to Google sign-in...")
                try {
                    await signInWithGoogleRedirect()
                    return
                } catch (redirectErr: any) {
                    setError(`Redirect failed: ${redirectErr.message}`)
                    setLoading(null)
                }
            } else if (err.code === "auth/popup-closed-by-user") {
                setError("Sign-in cancelled.")
                setLoading(null)
            } else if (err.code === "auth/configuration-not-found") {
                setError("Firebase Authentication is not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Google.")
                setLoading(null)
            } else {
                const msg = err.response?.data?.detail || err.message || "Unknown error"
                setError(`Google sign-in failed: ${msg}`)
                setLoading(null)
            }
        }
    }

    const handleGoogleRedirectLogin = async () => {
        if (!firebaseAvailable) {
            setError("Firebase is not configured. Please add your Firebase environment variables.")
            return
        }
        setLoading("google")
        setError("")
        try {
            await signInWithGoogleRedirect()
        } catch (err: any) {
            setError(`Redirect error: ${err.message}`)
            setLoading(null)
        }
    }

    const handleGithubLogin = () => {
        setLoading("github")
        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            redirect_uri: GITHUB_REDIRECT_URI,
            scope: "read:user repo",
        })
        window.location.href = `https://github.com/login/oauth/authorize?${params}`
    }

    return (
        <div className="min-h-screen bg-[#FCFCFD] flex flex-col justify-between selection:bg-orange-100 selection:text-orange-900 relative overflow-hidden">
            {/* SaaS Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
            </div>

            {/* Warm Ambient Radial Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div
                    className="w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", filter: "blur(70px)" }}
                />
            </div>

            {/* Minimal Top Navigation */}
            <header className="relative z-20 w-full max-w-6xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <span
                        className="text-[17px] sm:text-[20px] font-bold tracking-tight text-[#F97316] transition-transform group-hover:scale-105"
                        style={{ fontFamily: pixel }}
                    >
                        PathForge
                    </span>
                </Link>
                <Link
                    href="/"
                    className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                    &larr; Back to Home
                </Link>
            </header>

            {/* Main Center Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md mx-auto"
                >
                    {/* Badge */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-orange-200/70 bg-orange-50/60 text-orange-600 text-[12px] font-bold tracking-wide shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI CAREER KNOWLEDGE GRAPH
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                            Welcome to{" "}
                            <span style={{ fontFamily: editorial, fontStyle: "italic", color: "#F97316" }}>
                                PathForge
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            Sign in to analyze your GitHub and LinkedIn profiles into a living 3D skills graph.
                        </p>
                    </div>

                    {/* Elevated Card */}
                    <div className="bg-white border border-slate-200/80 shadow-2xl shadow-slate-200/60 rounded-3xl p-7 sm:p-9 backdrop-blur-sm">
                        <div className="space-y-3.5">
                            {/* Google Sign-In */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                id="google-signin-btn"
                                onClick={handleGoogleLogin}
                                disabled={!!loading}
                                className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 text-slate-800 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading === "google" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                ) : (
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                <span>Continue with Google</span>
                            </motion.button>

                            {/* Pop-up bypass / Direct redirect option */}
                            <div className="text-center -mt-1 pb-1">
                                <button
                                    type="button"
                                    onClick={handleGoogleRedirectLogin}
                                    disabled={!!loading}
                                    className="text-[11px] text-slate-400 hover:text-orange-600 transition-colors font-medium cursor-pointer"
                                >
                                    Pop-up blocked? <span className="underline font-bold text-slate-500 hover:text-orange-600">Sign in with direct redirect &rarr;</span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">or</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* GitHub OAuth */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                id="github-signin-btn"
                                onClick={handleGithubLogin}
                                disabled={!!loading || !GITHUB_CLIENT_ID}
                                className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading === "github" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                ) : (
                                    <Github className="w-5 h-5 shrink-0" />
                                )}
                                <span>Continue with GitHub</span>
                                {!GITHUB_CLIENT_ID && (
                                    <span className="ml-auto text-[10px] text-slate-400 font-normal">OAuth setup required</span>
                                )}
                            </motion.button>
                        </div>

                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 overflow-hidden"
                                >
                                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Demo Mode Link */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-500">Just exploring?</span>
                            <Link
                                href="/dashboard?demo=true"
                                className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 group"
                            >
                                Try the interactive demo
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                        Secure authentication powered by Firebase &bull; No passwords stored
                    </p>
                </motion.div>
            </main>

            {/* Subtle Footer */}
            <footer className="relative z-10 py-6 text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} PathForge. Built for developers ready to grow.
            </footer>
        </div>
    )
}
