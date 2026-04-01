const allowedImageHosts = (
  process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS ??
  "images.unsplash.com,plus.unsplash.com"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: allowedImageHosts.map((hostname) => ({
      protocol: "https",
      hostname
    }))
  }
};

export default nextConfig;
