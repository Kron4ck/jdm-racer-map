import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet re-initializes on React 18 Strict Mode's double-effect invocation in dev.
  // This only affects development — production (Telegram) is unaffected.
  reactStrictMode: false,
};

export default nextConfig;
