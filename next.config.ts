import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub profile images (if using GitHub OAuth)
      'k.kakaocdn.net', // Kakao profile images
    ],
  },
};

export default nextConfig;
