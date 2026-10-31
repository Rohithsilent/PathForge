"use client"
import { useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useTourStore } from "@/stores/tourStore"

const TOUR_SEEN_KEY = "orbitx-tour-seen"

export default function DashboardTour() {
    const { isTourActive, startTour, endTour } = useTourStore()

    // Auto-start tour on first visit
    useEffect(() => {
        const hasSeen = localStorage.getItem(TOUR_SEEN_KEY)
        if (!hasSeen) {
            // Small delay so the dashboard UI renders first
            const timer = setTimeout(() => startTour(), 1500)
            return () => clearTimeout(timer)
        }
    }, [startTour])

    useEffect(() => {
        if (!isTourActive) return

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768

        // Small delay to ensure DOM is ready
        const timeout = setTimeout(() => {
            // Build steps based on screen size
            const steps: any[] = [
                {
                    element: "#tour-graph",
                    popover: {
                        title: "🌐 3D Knowledge Graph",
                        description: "This is your interactive skill constellation. Each node represents a technology, language, or concept found in your repositories. Drag to rotate, scroll to zoom, and click any node for details.",
                        side: isMobile ? "bottom" : "left",
                        align: "center",
                    },
                },
                {
                    element: "#tour-search",
                    popover: {
                        title: "🔍 Search & Filter",
                        description: "Search for specific skills or filter by category — Frontend, Backend, ML, DevOps, and more.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#tour-legend",
                    popover: {
                        title: "🎨 Color Legend",
                        description: "Each color represents a different skill category. Use this legend to quickly identify repos, languages, frameworks, and more.",
                        side: "top",
                        align: "start",
                    },
                },
            ]

            // Desktop-only steps (controls bar + profile are hidden on mobile)
            if (!isMobile) {
                steps.push(
                    {
                        element: "#tour-controls",
                        popover: {
                            title: "⚡ Panel Controls",
                            description: "<ul style='margin:0;padding-left:16px;list-style:disc;line-height:2'><li><b>Insights</b> — AI skill analysis, career readiness score & gap detection</li><li><b>Market</b> — Real-time demand data for your skills</li><li><b>Recruiter</b> — See how employers view your profile</li><li><b>Analytics</b> — Deep-dive stats & charts for your skill distribution</li></ul>",
                            side: "bottom",
                            align: "center",
                        },
                    },
                    {
                        element: "#tour-profile",
                        popover: {
                            title: "👤 Your Profile",
                            description: "Click here to access your profile menu — navigate home, view analytics, or sign out.",
                            side: "bottom",
                            align: "end",
                        },
                    },
                )
            } else {
                // Mobile: point to the hamburger menu instead
                steps.push({
                    popover: {
                        title: "☰ Navigation Menu",
                        description: "Tap the <b>hamburger menu</b> (☰) in the top-right to access all panels: Insights, Market, Recruiter, Analytics, and more.",
                    },
                })
            }

            // Final step
            steps.push({
                popover: {
                    title: "🚀 You're All Set!",
                    description: "Explore your knowledge graph, discover skill gaps, and plan your career roadmap. Happy exploring!",
                },
            })

            const driverObj = driver({
                showProgress: true,
                animate: true,
                overlayColor: "rgba(0, 0, 0, 0.6)",
                stagePadding: isMobile ? 4 : 8,
                stageRadius: 12,
                popoverClass: "pathforge-tour-popover",
                onDestroyStarted: () => {
                    localStorage.setItem(TOUR_SEEN_KEY, "true")
                    driverObj.destroy()
                    endTour()
                },
                steps,
            })

            driverObj.drive()
        }, 300)

        return () => clearTimeout(timeout)
    }, [isTourActive, endTour])

    return null
}
