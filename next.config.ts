import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid corrupted webpack disk cache on Windows (EBUSY / missing chunk modules)
  webpack: (config, { dev }) => {
    if (dev && process.platform === "win32") {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
