console.log("Backend URL:", process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL);
console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);
console.log("MinIO Endpoint:", process.env.NEXT_PUBLIC_MINIO_ENDPOINT);
console.log("Search Endpoint:", process.env.NEXT_PUBLIC_SEARCH_ENDPOINT);

const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@heroicons/react',
      '@medusajs/icons',
      '@medusajs/ui',
      '@carbon/react',
      'lodash',
      'react-country-flag',
      '@sanity/icons',
    ],
    esmExternals: 'loose',
    serverActions: {
      // PO Upload sends the buyer's PDF/image as base64 (≤15MB file ≈ 20MB
      // encoded) through a server action; the default limit is 1MB.
      bodySizeLimit: '25mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https") ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, ""),
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace("https://", ""),
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT
        ? [
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "cardinalcoolingsystems.com",
      },
      {
        protocol: "https",
        hostname: "sanitube.us",
      },
      // Railway bucket for MinIO/uploaded images
      {
        protocol: "https",
        hostname: "bucket-production-02b9.up.railway.app",
      },
    ],
  },
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  },
  // PostHog requires trailing-slash requests to /ingest to pass through
  // untouched (Next's default trailing-slash redirect breaks ingestion)
  skipTrailingSlashRedirect: true,
  // First-party proxy for PostHog so ad blockers don't drop analytics.
  // The SDK is initialized with api_host '/ingest' in tracking-scripts.tsx.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Keep Sanity Studio out of search engines even if the page-level
  // <meta name="robots"> tag from next-sanity is ever removed
  async headers() {
    return [
      {
        source: '/studio',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/studio/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  // ✅ REDIRECTS ADDED HERE
  async redirects() {
    return [
      // Consolidate accidental /industries/* duplicates onto canonical /us/*
      {
        source: '/industries',
        destination: '/us',
        permanent: true,
      },
      {
        source: '/industries/:path*',
        destination: '/us/:path*',
        permanent: true,
      },
      // Blog redirect
      {
        source: '/us/blog/all',
        destination: '/us/blog',
        permanent: true,
      },
      // Customer service to contact
      {
        source: '/us/customer-service',
        destination: '/us/contact',
        permanent: true,
      },
      // Category pages - redirect to categories route
      {
        source: '/us/fittings',
        destination: '/us/categories/fittings',
        permanent: true,
      },
      {
        source: '/us/valves',
        destination: '/us/categories/valves',
        permanent: true,
      },
      {
        source: '/us/tubes',
        destination: '/us/categories/tubes',
        permanent: true,
      },
      {
        source: '/us/tube',
        destination: '/us/categories/tubes',
        permanent: true,
      },
      {
        source: '/us/clamp-fittings',
        destination: '/us/categories/clamp-fittings',
        permanent: true,
      },
      {
        source: '/us/butterfly-valves',
        destination: '/us/categories/butterfly-valves',
        permanent: true,
      },
      {
        source: '/us/clamp-adapters',
        destination: '/us/categories/clamp-adapters',
        permanent: true,
      },
      {
        source: '/us/i-line-clamps',
        destination: '/us/categories/i-line-clamps',
        permanent: true,
      },
      {
        source: '/us/hex-nuts',
        destination: '/us/categories/hex-nuts',
        permanent: true,
      },
      {
        source: '/us/45-elbows',
        destination: '/us/categories/45-elbows',
        permanent: true,
      },
      {
        source: '/us/clamp-concentric-reducers',
        destination: '/us/categories/clamp-concentric-reducers',
        permanent: true,
      },
      {
        source: '/us/bevel-seat-gaskets',
        destination: '/us/categories/bevel-seat-gaskets',
        permanent: true,
      },
      {
        source: '/us/plain-bevel-seat-ferrules',
        destination: '/us/categories/plain-bevel-seat-ferrules',
        permanent: true,
      },
      {
        source: '/us/bevel-seat-fittings',
        destination: '/us/categories/bevel-seat-fittings',
        permanent: true,
      },
      {
        source: '/us/i-line-fittings',
        destination: '/us/categories/i-line-fittings',
        permanent: true,
      },
      {
        source: '/us/tube-flanges',
        destination: '/us/categories/tube-flanges',
        permanent: true,
      },
      {
        source: '/us/sight-glass',
        destination: '/us/categories/sight-glass',
        permanent: true,
      },
      {
        source: '/us/straight-tees',
        destination: '/us/categories/straight-tees',
        permanent: true,
      },
      {
        source: '/us/i-line-ferrules',
        destination: '/us/categories/i-line-ferrules',
        permanent: true,
      },
      {
        source: '/us/bevel-seat-caps',
        destination: '/us/categories/bevel-seat-caps',
        permanent: true,
      },
      {
        source: '/us/concentric-reducers',
        destination: '/us/categories/concentric-reducers',
        permanent: true,
      },
      {
        source: '/us/sanitary-ball-valves',
        destination: '/us/categories/sanitary-ball-valves',
        permanent: true,
      },
      {
        source: '/us/laterals-and-wyes',
        destination: '/us/categories/laterals-and-wyes',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
