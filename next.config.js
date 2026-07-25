/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSVs are read at runtime by the draft API, so explicitly include them in
  // Vercel's serverless function trace instead of relying on static imports.
  outputFileTracingIncludes: {
    '/*': ['./lib/**/*.csv'],
  },
};

module.exports = nextConfig;
