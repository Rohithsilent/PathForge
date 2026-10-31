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
}

module.exports = nextConfig
