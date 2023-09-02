module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/budgets',
        permanent: true,
      },
    ]
  },
};
