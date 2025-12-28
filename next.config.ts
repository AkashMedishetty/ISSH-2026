import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false, // Disable to prevent double-rendering which crashes WebGL
};

export default nextConfig;
