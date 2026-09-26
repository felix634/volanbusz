import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Teljesen statikus oldal: a build az `out/` mappába exportál (Netlify ezt publikálja)
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
