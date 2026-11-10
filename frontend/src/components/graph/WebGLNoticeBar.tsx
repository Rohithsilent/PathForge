"use client"
import React, { useState } from "react"
import { ChevronDown, X, MonitorOff, HelpCircle, CheckCircle2 } from "lucide-react"

interface WebGLNoticeBarProps {
    className?: string
}

export default function WebGLNoticeBar({ className = "" }: WebGLNoticeBarProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    // Collapsed / Minimized state when user dismissed the notice
    if (isDismissed) {
        return (
            <button
                onClick={() => {
                    setIsDismissed(false)
                    setIsExpanded(true)
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 text-amber-900 text-[11px] font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer ${className}`}
                title="3D WebGL is disabled in this browser. Click to see instructions on enabling 3D graphics acceleration."
            >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>2D Map</span>
                <span className="text-[10px] text-amber-700/80 font-normal hidden sm:inline">(WebGL off)</span>
                <HelpCircle className="w-3 h-3 text-amber-600 ml-0.5" />
            </button>
        )
    }

    return (
        <div className={`relative flex flex-col items-end shrink-0 ${className}`}>
            {/* Compact, non-distracting pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-50 border border-amber-200/90 text-amber-950 text-xs shadow-2xs transition-all">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-[11px] tracking-tight">2D Mode Active</span>
                </span>

                <span className="text-[11px] text-amber-800/80 hidden md:inline">
                    • Hardware acceleration off
                </span>

                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-amber-200/80">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline decoration-amber-300 underline-offset-2 transition-colors cursor-pointer"
                        title="View tip on how to enable 3D acceleration"
                    >
                        <span>{isExpanded ? "Hide tip" : "Enable 3D"}</span>
                        <ChevronDown
                            className={`w-3 h-3 transition-transform duration-200 text-amber-700 ${
                                isExpanded ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    <button
                        onClick={() => setIsDismissed(true)}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-amber-600 hover:text-amber-900 hover:bg-amber-100/80 transition-colors cursor-pointer ml-0.5"
                        aria-label="Dismiss 2D notice"
                        title="Dismiss notice"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Expandable Tip Popover */}
            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 z-40 w-80 sm:w-96 p-4 rounded-2xl bg-white border border-amber-200/90 shadow-xl text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                            <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                                <MonitorOff className="w-3.5 h-3.5" />
                            </span>
                            <span>Why is 2D Mode active?</span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                        Your browser or graphics driver has hardware graphics acceleration disabled. All skills, career scores, gap analysis, and simulations remain <strong>fully functional</strong> in 2D mode below.
                    </p>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                            <span>To enable the 3D Knowledge Graph:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-amber-900/90 text-[11px] leading-relaxed pl-1">
                            <li>
                                In Chrome, Brave, or Edge, open{" "}
                                <code className="bg-amber-100/90 text-amber-950 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold">
                                    Settings &gt; System
                                </code>
                            </li>
                            <li>
                                Enable <strong>&ldquo;Use graphics acceleration when available&rdquo;</strong>
                            </li>
                            <li>Restart or relaunch your browser</li>
                        </ol>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition shadow-xs cursor-pointer"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

