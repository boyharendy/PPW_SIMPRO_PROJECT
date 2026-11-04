import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 169.254.*.* = alamat link-local yang dipakai browser preview IDE; tanpa ini
  // Next.js memblokir aset dev (JS chunk) sehingga halaman tidak ter-hydrate.
  allowedDevOrigins: [
    '192.168.56.1',
    'localhost',
    '127.0.0.1',
    '169.254.8.6',
    '169.254.*.*',
  ],
};

export default nextConfig;
