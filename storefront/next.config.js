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
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
    esmExternals: 'loose'
  },
  images: {
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
  }
}

module.exports = nextConfig
