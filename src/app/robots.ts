import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.appUrl || "https://gorila-strong.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nada de esto aporta a un buscador y parte requiere sesión.
      disallow: ["/admin", "/api", "/checkout", "/carrito", "/mi-cuenta", "/mis-pedidos"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
