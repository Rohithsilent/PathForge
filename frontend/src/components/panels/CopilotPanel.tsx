"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useChatStore } from "@/stores/chatStore"
import { useGraphStore } from "@/stores/graphStore"
import api from "@/lib/api"

const QUICK_PROMPTS = [
    { label: "🔥 Roast my profile", prompt: "Roast my developer profile. Be brutally honest and funny about my skills." },
    { label: "📚 What to learn next", prompt: "Based on my skill profile, what should I learn next to maximize my career value?" },
    { label: "💼 Interview prep", prompt: "Help me prepare for a tech interview. What are my strongest talking points?" },
    { label: "🗺️ Career roadmap", prompt: "Create a 3-month career acceleration plan based on my current skills and gaps." },
]

export default function CopilotPanel() {
    const { messages, isLoading, addMessage, setLoading } = useChatStore()
    const { analysisEngine } = useGraphStore()
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    // Focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 300)
    }, [])

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return

        addMessage("user", text.trim())
        setInput("")
        setLoading(true)

        try {
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }))

            const res = await api.post("/chat/message", {
                message: text.trim(),
                history,
                engine: "orbitx",
                provider: analysisEngine,
            })

            addMessage("assistant", res.data.response)
        } catch (err) {
            addMessage(
                "assistant",
                "Hmm, I'm having trouble connecting. Make sure the backend is running and try again!"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">PathForge Copilot</h2>
                        <p className="text-[10px] text-slate-400 font-medium">Engine: {analysisEngine === 'openrouter' ? '✦ OpenRouter' : '◎ Ollama'} · uses your real data</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                {messages.length === 0 && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-2"
                    >
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 mb-1">Hey! I'm your AI career coach.</p>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                                I can see your real skills from your analyzed repos. Ask me anything or try a quick prompt:
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_PROMPTS.map((qp) => (
                                <button
                                    key={qp.label}
                                    onClick={() => sendMessage(qp.prompt)}
                                    className="text-left px-3 py-2.5 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-[11px] font-semibold text-slate-600 hover:text-orange-700 leading-tight"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md font-medium"
                                        : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md font-medium"
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium ml-1">thinking...</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1 border border-slate-200 focus-within:border-orange-300 focus-within:bg-white transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your skills..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 py-2.5 outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={isLoading || !input.trim()}
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-orange-600 hover:to-orange-700 transition-all shrink-0"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
