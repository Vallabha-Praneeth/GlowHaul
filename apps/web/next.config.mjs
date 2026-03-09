import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@glowhaul/config', '@glowhaul/core', '@glowhaul/ui'],
  turbopack: {
    root: path.join(process.cwd(), '../..'),
  },
};

export default nextConfig;
