import { motion } from "framer-motion"

export default function PanelSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-shimmer" style={{
                    backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
                    backgroundSize: '200% 100%'
                }} />
                <div className="flex-1">
                    <div className="w-1/3 h-5 rounded bg-slate-100 mb-2 animate-shimmer" style={{
                        backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
                        backgroundSize: '200% 100%'
                    }} />
                    <div className="w-1/4 h-3 rounded bg-slate-100 animate-shimmer" style={{
                        backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
                        backgroundSize: '200% 100%'
                    }} />
                </div>
            </div>

            {/* Content Blocks Skeleton */}
            <div className="space-y-4 flex-1">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-24 rounded-xl bg-slate-50 border border-slate-100 p-4 shrink-0 flex flex-col justify-center">
                        <div className="w-1/2 h-4 rounded bg-slate-200 mb-3 animate-shimmer" style={{
                            backgroundImage: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)',
                            backgroundSize: '200% 100%'
                        }} />
                        <div className="w-3/4 h-3 rounded bg-slate-200 animate-shimmer" style={{
                            backgroundImage: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)',
                            backgroundSize: '200% 100%'
                        }} />
                    </div>
                ))}
            </div>
        </div>
    )
}
