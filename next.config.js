/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.clerk.dev',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
      },
    ],
  },
}

module.exports = nextConfig 