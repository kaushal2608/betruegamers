/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'raw.githubusercontent.com',
      'cdn.cloudflare.steamstatic.com',
      'res.cloudinary.com',
      'api.dicebear.com'
    ]
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

// Force Next.js dev server reload
export default nextConfig;

