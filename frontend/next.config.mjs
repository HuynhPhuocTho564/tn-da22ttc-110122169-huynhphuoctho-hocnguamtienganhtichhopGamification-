/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
