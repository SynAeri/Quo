/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*', // Use localhost instead of IP
        },
      ]
    }
    // In production, don't rewrite - let the frontend use NEXT_PUBLIC_API_URL directly
    return []
  },
};

export default nextConfig;
