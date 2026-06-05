import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's dev cache has no size limit and can grow to tens of GB on Windows.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
