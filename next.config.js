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
        protocol: "http", // Use http for internal Docker network
        hostname: "minio-lsgcwgcscgowkogk8c8kcgss", // Docker service name
        port: "", // Internal Minio port
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
        hostname: "dashboard.kdgs.ca",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "*.dashboard.kdgs.ca",
        pathname: "/**"
      }
    ]
  }
};

module.exports = nextConfig;
