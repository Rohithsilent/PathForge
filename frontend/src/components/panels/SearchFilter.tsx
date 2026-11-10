"use client"
import { useGraphStore } from "@/stores/graphStore"
import { CATEGORY_COLORS } from "@/lib/mock-data"

export const CATEGORIES = ["all", "frontend", "backend", "ml", "devops", "database", "cert", "concept"]

interface SearchFilterProps {
    className?: string
    variant?: "floating" | "inline"
}

export default function SearchFilter({ className = "", variant = "floating" }: SearchFilterProps) {
    const { searchTerm, setSearchTerm, filterCategory, setFilterCategory } = useGraphStore()

    const baseClasses =
        variant === "floating"
            ? "absolute top-3 left-3 md:top-4 md:left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-24px)] md:max-w-none"
            : "flex flex-col gap-2 w-full"

    return (
        <div id="tour-search" className={`${baseClasses} ${className}`}>
            {/* Search input */}
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skills..."
                className="w-52 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2
                   font-bold text-xs text-slate-900 placeholder:text-slate-400
                   shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10
                   transition-all"
            />

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat === filterCategory ? "all" : cat)}
                        className="px-2 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider border transition-all hover:scale-105"
                        style={{
                            borderColor: filterCategory === cat
                                ? (CATEGORY_COLORS[cat] || "#0F172A")
                                : "#E2E8F0",
                            color: filterCategory === cat
                                ? (CATEGORY_COLORS[cat] || "#0F172A")
                                : "#94A3B8",
                            background: filterCategory === cat
                                ? `${CATEGORY_COLORS[cat] || "#0F172A"}10`
                                : "rgba(255,255,255,0.8)",
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    )
}
