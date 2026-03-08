import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'i.pravatar.cc' },
      { hostname: 'picsum.photos' },
    ],
  },
}

export default nextConfig
