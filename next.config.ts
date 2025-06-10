
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Enable static HTML export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // For local images in the `public` folder, no `remotePatterns` are needed.
    // If you were using external images, you would add their domains here in remotePatterns.
    unoptimized: true, // Required for static export if not using a custom loader
  },
};

export default nextConfig;
