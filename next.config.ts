
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
    // No remote patterns needed if only using local images
    // If you had other remote patterns, they would remain here.
  },
};

export default nextConfig;
