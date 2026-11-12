import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  devIndicators: false,
  agentRules: false,
  // The sign-in view lives at /login; the auth UI still links to its default path.
  async redirects() {
    return [{ source: "/auth/sign-in", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
