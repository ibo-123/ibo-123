/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    turbopack: true, // optional, but matches your build
  },
  turbopack: {
    root: '.', // ensures the root is your current folder
  },
};

module.exports = nextConfig;
