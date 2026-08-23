import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  env:{
     BACKEND_URL:process.env.BACKEND_URL
  },
};

export default nextConfig;
