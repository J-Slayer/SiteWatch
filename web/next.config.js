/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared types package from the monorepo
  transpilePackages: ['@sitewatch/types'],

  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
