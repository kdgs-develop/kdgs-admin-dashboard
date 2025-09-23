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
        source: "/public/search",
        destination: "https://search.kdgs.ca",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
