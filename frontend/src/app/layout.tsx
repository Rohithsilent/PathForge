import type { Metadata } from 'next'
import { Instrument_Serif } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Pixelify_Sans } from "next/font/google"
import './globals.css'

const editorial = Instrument_Serif({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-editorial",
    display: "swap",
})

const pixelify = Pixelify_Sans({
    subsets: ["latin"],
    variable: "--font-pixel",
    display: "swap",
})

export const metadata: Metadata = {
    title: 'PathForge — Find Your Path in Tech',
    description: 'Built for beginner students who are tired of guessing. Paste a GitHub repo and see what each technology is for, what you actually know, and what to learn next — as an interactive 3D skill map.',
    applicationName: 'PathForge',
    icons: {
        icon: '/favicon.svg',
        apple: '/favicon.svg',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${GeistSans.variable} ${GeistMono.variable} ${editorial.variable} ${pixelify.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    )
}
