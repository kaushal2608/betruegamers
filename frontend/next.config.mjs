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
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      }
    ];
  }
};

// Force Next.js dev server reload
export default nextConfig;

