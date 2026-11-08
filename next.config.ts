import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The intercom is filmed full-screen: never show the dev-mode badge.
  devIndicators: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
