import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@ahtapot/db"],
  output: "standalone",
};

export default nextConfig;
