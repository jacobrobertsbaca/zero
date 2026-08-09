/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/transactions",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
