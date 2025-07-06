import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Uncomment and set the basePath if your repo name is not the root domain
  // basePath: '/personal-finance-planner',
  // assetPrefix: '/personal-finance-planner/',
};

export default nextConfig;
