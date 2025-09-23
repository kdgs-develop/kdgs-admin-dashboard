/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ... existing patterns
      {
        protocol: "https",
        hostname: process.env.MINIO_ENDPOINT,
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "kdgs-admin-dashboard.vercel.app",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "kdgs-admin-dashboard-*.vercel.app",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "search.kdgs.ca",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "*.search.kdgs.ca",
        pathname: "/**"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*', // Match all paths on the subdomain
        has: [
          {
            type: 'host',
            value: 'dashboard.kdgs.ca', // Source subdomain
          },
        ],
        destination: 'https://search.kdgs.ca', // Target subdomain
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/public/search', // Match this path on the subdomain
        has: [
          {
            type: 'host',
            value: 'dashboard.kdgs.ca', // Source subdomain
          },
        ],
        destination: 'https://search.kdgs.ca/dashboard', // Target subdomain
        permanent: true, // 301 redirect for SEO
      },
    ];
  },
};

module.exports = nextConfig;
