import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '169.254.8.6',
    'localhost',
    '127.0.0.1',
    '192.168.56.1',
  ],
};

export default nextConfig;
