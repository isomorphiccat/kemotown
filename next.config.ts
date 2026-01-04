import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub profile images (if using GitHub OAuth)
      'k.kakaocdn.net', // Kakao profile images
    ],
  },
  // Output configuration for Vercel deployment
  output: 'standalone',
  // Exclude large directories from output file tracing
  outputFileTracingExcludes: {
    '*': [
      'v0-archive/**',
      'node_modules/@swc/**',
      'node_modules/esbuild/**',
    ],
  },
};

export default nextConfig;
