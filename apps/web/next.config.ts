import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@base-app/ui', '@base-app/api'],
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default nextConfig
