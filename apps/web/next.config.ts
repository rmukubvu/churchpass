import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point Turbopack at the monorepo root so it resolves workspace packages correctly
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    // Allow Next.js Image to serve local /public files unoptimised in dev,
    // and accept external URLs (Cloudflare R2, Supabase storage) in production.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
    ],
  },
};

export default nextConfig;
