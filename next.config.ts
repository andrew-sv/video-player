import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mock artwork comes from picsum (stand-in for the image CDN).
    remotePatterns: [
      new URL("https://picsum.photos/**"),
      new URL("https://fastly.picsum.photos/**"),
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
