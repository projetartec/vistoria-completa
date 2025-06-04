
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // For local images in the `public` folder, no `remotePatterns` are needed.
    // If you were using external images, you would add their domains here in remotePatterns.
  },
};

export default nextConfig;
