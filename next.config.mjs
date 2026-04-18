const defaultImageHosts = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "starnutrition.com.ar",
  "www.starnutrition.com.ar",
  "titannutrition.net",
  "www.titannutrition.net",
  "res.cloudinary.com"
];

const allowedImageHosts = Array.from(
  new Set(
    [
      ...defaultImageHosts,
      ...(process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean)
    ]
  )
);

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
