import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the container
  // image. See Dockerfile — the runner stage copies only this output.
  output: "standalone",
};

export default nextConfig;
