import Image from "next/image";
import Link from "next/link";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { HomeFeaturedProducts } from "@/components/site/home-featured-products";
import { PromoBanner } from "@/components/site/promo-banner";
import { Reveal } from "@/components/ui/reveal";
import {
  getHomeProducts,
  listProductBrands
} from "@/modules/products/product.service";

// ISR: el HTML se genera una vez y se sirve desde el CDN. Las mutaciones del
// admin lo invalidan al instante (revalidateProductPages en product.service),
// así que esta ventana solo cubre cambios de stock por ventas.
export const revalidate = 60;

export default async function HomePage() {
  // El error se captura porque esta página sí se prerenderiza en el build: si
  // la base no responde durante un deploy, preferimos una home sin destacados
  // (que se recompone sola en la siguiente revalidación) antes que un deploy
  // fallado. El catálogo, que es dinámico, sigue funcionando igual.
  const [homeProducts, brands] = await Promise.all([
    getHomeProducts(8).catch((error) => {
      console.error("[home] no se pudieron cargar los productos", error);
      return [];
    }),
    listProductBrands().catch(() => [] as string[])
  ]);

  // El hero muestra un producto real del catálogo en vez de texto sobre un
  // degradado vacío. Con el fondo recortado, el envase se apoya sobre el tema
  // oscuro en lugar de aparecer dentro de un rectángulo blanco.
  const heroProduct = homeProducts.find((product) => product.image) ?? null;

  return (
    <div className="page-shell space-y-10 sm:space-y-14">
      <PromoBanner />

      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-surface shadow-card">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.16),transparent_45%),radial-gradient(circle_at_88%_75%,rgba(255,255,255,0.05),transparent_40%)]"
        />

        <div className="relative grid items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr,0.85fr] lg:gap-12 lg:px-14 lg:py-16">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow-wide text-ember">
              Suplementación deportiva · Villa Allende
            </p>
            <h1 className="mt-4 text-[2rem] font-black uppercase leading-[1.02] tracking-[0.02em] text-sand sm:text-[2.75rem] lg:text-[3.05rem]">
              Entrená fuerte.
              <span className="block text-ember">Suplementate mejor.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-mist sm:text-base lg:mx-0">
              Proteínas, creatinas y pre entrenos de marcas que conocemos y
              usamos. Te asesoramos para que compres lo que necesitás, no lo que
              más se vende.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/catalogo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-neon px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-ember"
              >
                Ver catálogo
              </Link>
              <Link
                href="/encontranos"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-hairline bg-white/5 px-7 text-sm font-semibold text-sand transition hover:border-white/25 hover:bg-white/10"
              >
                Dónde estamos
              </Link>
            </div>
          </div>

          {heroProduct?.image ? (
            <Link
              href={`/productos/${heroProduct.slug}`}
              className="group relative mx-auto w-full max-w-sm lg:max-w-none"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.22),transparent_65%)] blur-2xl"
              />
              <div className="relative aspect-square">
                <Image
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain p-4 drop-shadow-[0_28px_48px_rgba(0,0,0,0.65)] transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="relative mt-2 text-center text-xs text-mist lg:text-left">
                {heroProduct.brand} · {heroProduct.name}
              </p>
            </Link>
          ) : null}
        </div>
      </section>

      <Reveal>
        <BrandMarquee brands={brands} />
      </Reveal>

      {homeProducts.length > 0 ? (
        <Reveal delay={80}>
          <HomeFeaturedProducts products={homeProducts} />
        </Reveal>
      ) : null}
    </div>
  );
}
