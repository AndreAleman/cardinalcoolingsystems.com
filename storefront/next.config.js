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
  // Add these lines for framer-motion fix
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
    esmExternals: 'loose'
  },
  // Your existing images config
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
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

      /* —------------------------- NEW DOMAIN HERE ------------------------- */
      {
        protocol: "https",
        hostname: "cardinalcoolingsystems.com",
      },
      // Keep sanitube.us for existing product images during migration
      {
        protocol: "https",
        hostname: "sanitube.us",
      },
    ],
  },

  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  }
}

module.exports = nextConfig
