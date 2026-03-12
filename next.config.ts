import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // Required for puppeteer-core + @sparticuz/chromium to work on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  ...(isProd ? {} : { turbopack: {} }),
};

export default nextConfig;
