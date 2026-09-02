import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listSitemapProducts } from "@/modules/products/product.service";

// Se regenera cada hora: los productos nuevos entran al sitemap sin redeploy.
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/catalogo", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/encontranos", priority: 0.5, changeFrequency: "monthly" as const }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.appUrl || "https://gorila-strong.vercel.app";
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  // Si la base no responde durante un deploy preferimos un sitemap con las
  // rutas fijas antes que un build fallado: se completa en la próxima
  // revalidación.
  const products = await listSitemapProducts().catch((error) => {
    console.error("[sitemap] no se pudieron listar los productos", error);
    return [];
  });

  return [
    ...staticEntries,
    ...products.map((product) => ({
      url: `${baseUrl}/productos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
