/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
    return [
      {
        source: '/api/:path*',           // Frontend calls /api/auth/login
        destination: 'http://localhost:8000/api/:path*', // Proxied to backend
      },
    ]
  },

};

export default nextConfig;
