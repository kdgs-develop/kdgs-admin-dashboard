/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ... existing patterns
      {
        protocol: 'https', // or 'http' if you're not using SSL
        hostname: process.env.MINIO_ENDPOINT,
        port: process.env.MINIO_PORT,
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;