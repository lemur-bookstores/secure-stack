import type { NextConfig } from "next";

// Next.js' sourcemap parser currently chokes on Turbopack chunk names that include
// reserved URL characters on Windows. Disabling sourcemap support in dev avoids
// the repeated "Invalid source map" noise until the upstream bug is fixed.
if (process.env.NODE_ENV !== "production") {
  process.env.NEXT_DISABLE_SOURCEMAP_SUPPORT = "1";
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
