/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ... existing patterns
      {
        protocol: "https",
        hostname: "minio-t0g840w8wc8wskws0cg80okw.82.180.133.192.sslip.io",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "http", // Use http for internal Docker network
        hostname: "minio", // Docker service name
        port: "9000", // Internal Minio port
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
