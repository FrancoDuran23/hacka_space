import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  devIndicators: false,
  agentRules: false,
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "samas-pc.local",
    "192.168.177.93",
  ],
};

export default nextConfig;
