import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const s3BaseUrl =
  process.env.S3_PUBLIC_URL ||
  process.env.S3_PUBLIC_BASE_URL ||
  process.env.S3_BASE_URL ||
  process.env.AWS_S3_BASE_URL ||
  process.env.NEXT_PUBLIC_S3_BASE_URL ||
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  '';

const s3Hostname = (() => {
  if (!s3BaseUrl) return null;
  try {
    return new URL(s3BaseUrl).hostname;
  } catch {
    return null;
  }
})();

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
      ...(s3Hostname
        ? [
            {
              protocol: 'https' as const,
              hostname: s3Hostname,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  allowedDevOrigins: ['192.168.1.43'],
};


 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
