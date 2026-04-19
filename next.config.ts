import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'crm.lifematewellness.com',
        port: '443',
        pathname: '/**',
      },
    ],
  },
};


 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
