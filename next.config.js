module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/transactions',
        permanent: true,
      },
    ]
  },
};
