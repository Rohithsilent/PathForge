/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    poweredByHeader: false,
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    images: {
        domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
    },
    async rewrites() {
        return [
            {
                source: '/__/auth/:path*',
                destination: 'https://pathforge-87c24.firebaseapp.com/__/auth/:path*',
            },
        ]
    },
}

module.exports = nextConfig
