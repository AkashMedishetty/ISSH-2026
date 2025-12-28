import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false, // Disable to prevent double-rendering which crashes WebGL
  images: {
    // Enable optimization with compressed images
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
