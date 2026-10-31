"use client"
import { useEffect, useState } from "react"

export default function AnimatedCounter({ 
    value, 
    duration = 1000, 
    suffix = "" 
}: { 
    value: number
    duration?: number
    suffix?: string
}) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime: number | null = null
        let animationFrameId: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = timestamp - startTime

            // Ease-out cubic animation
            const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
            
            if (progress < duration) {
                const currentCount = Math.floor(easeOut(progress / duration) * value)
                setCount(currentCount)
                animationFrameId = requestAnimationFrame(animate)
            } else {
                setCount(value)
            }
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationFrameId)
    }, [value, duration])

    return <>{count}{suffix}</>
}
