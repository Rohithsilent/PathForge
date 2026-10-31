"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { authGithub, syncGithubGraph } from "@/lib/api"

function AuthCallbackInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setUser, setIsDemo } = useAuthStore()
    const [status, setStatus] = useState("Authenticating...")
    const [failed, setFailed] = useState(false)

    const processLogin = async (code: string) => {
        setFailed(false)
        setStatus("Authenticating...")

        try {
            console.log("Exchanging code with GitHub...")
            const { access_token, user } = await authGithub(code)

            localStorage.setItem("token", access_token)
            setUser({
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                target_role: user.target_role
            })
            setIsDemo(false)

            setStatus("Syncing GitHub Data... (This takes a moment)")
            await syncGithubGraph(user.github_token || access_token)

            setStatus("Redirecting...")
            router.push("/dashboard")
        } catch (err: any) {
            console.error("Login failed", err)
            const msg = err.response?.data?.detail || err.message || "Unknown error"
            setStatus(`Login failed: ${msg}`)
            setFailed(true)
        }
    }

    useEffect(() => {
        const code = searchParams.get("code")
        if (!code) {
            router.push("/")
            return
        }
        processLogin(code)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-white">
            <div className="text-center space-y-4 max-w-md px-6">
                {!failed && (
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
                )}
                <p className={`font-semibold font-mono ${failed ? 'text-red-500' : 'text-slate-500 animate-pulse'}`}>
                    {status}
                </p>
                {failed && (
                    <div className="space-y-3 pt-2">
                        <p className="text-sm text-slate-400">
                            Make sure the backend server is running on port 8000.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    const code = searchParams.get("code")
                                    if (code) processLogin(code)
                                }}
                                className="px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="px-5 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
        }>
            <AuthCallbackInner />
        </Suspense>
    )
}
