import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@planfortwo/types', '@planfortwo/validators', '@planfortwo/db'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
  webpack: (config) => {
    // Resolve .js imports to .ts files in transpiled workspace packages
    // (e.g., @planfortwo/db uses .js extensions for ESM compatibility)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
