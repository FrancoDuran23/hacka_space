import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  devIndicators: false,
  agentRules: false,
};

export default nextConfig;
