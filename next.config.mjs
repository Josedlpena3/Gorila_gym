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
    // `domains` está deprecado desde Next 14 y res.cloudinary.com ya viaja en
    // allowedImageHosts, así que remotePatterns lo cubre por completo.
    remotePatterns: allowedImageHosts.map((hostname) => ({
      protocol: "https",
      hostname
    })),
    // Las fotos de producto son capturas de pantalla en PNG, el formato más
    // pesado posible para una foto. Next negocia con el Accept del navegador y
    // cae a WebP donde no haya soporte de AVIF.
    formats: ["image/avif", "image/webp"],
    // Las URLs de Cloudinary vienen versionadas (/v1776615267/), así que la
    // imagen nunca cambia bajo la misma URL: se puede cachear 30 días.
    minimumCacheTTL: 2592000
  }
};

export default nextConfig;
