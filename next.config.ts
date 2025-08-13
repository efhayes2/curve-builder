import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'storage.googleapis.com',
        protocol: 'https',
        pathname: '/mrgn-public/**/*',
      },
    ],
  },
  eslint: {
    // ✅ Skip ESLint errors during Vercel builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
