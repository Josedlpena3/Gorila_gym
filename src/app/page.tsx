import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { StatusCard } from "@/components/layout/status-card";
import { getFeaturedProducts } from "@/modules/products/product.service";
import { tryGetCurrentUser } from "@/modules/users/user.service";

async function loadFeaturedProducts() {
  try {
    return await getFeaturedProducts(3);
  } catch (error) {
    console.error("[home-page] no se pudieron cargar los productos destacados", error);
    return null;
  }
}

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90";

const secondaryLinkClass =
  "inline-flex items-center justify-center rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-semibold text-sand transition hover:border-neon/60 hover:bg-white/10";

export default async function HomePage() {
  const [featuredProducts, user] = await Promise.all([
    loadFeaturedProducts(),
    tryGetCurrentUser("home-page")
  ]);

  return (
    <div className="page-shell space-y-8 sm:space-y-10">
      <section className="section-card overflow-hidden p-6 sm:p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-neon sm:text-sm">
          Gorila Strong
        </p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[0.06em] text-sand sm:text-5xl lg:text-6xl">
              Suplementación premium lista para vender en producción.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-mist sm:text-base">
              Explorá el catálogo, gestioná pedidos y seguí el estado de tu cuenta desde
              una home estable que no depende de redirecciones para responder en `/`.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalogo" className={primaryLinkClass}>
                Explorar catálogo
              </Link>
              <Link
                href={user ? "/mi-cuenta" : "/login?next=/mi-cuenta"}
                className={secondaryLinkClass}
              >
                {user ? "Ir a mi cuenta" : "Ingresar"}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[28px] border border-line bg-ink/65 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-mist">Deploy</p>
              <p className="mt-2 text-lg font-black uppercase text-sand">Vercel Ready</p>
              <p className="mt-2 text-sm leading-6 text-mist">
                Build compatible con Node 18/20 y Prisma generado en instalación.
              </p>
            </div>
            <div className="rounded-[28px] border border-line bg-ink/65 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-mist">Base de datos</p>
              <p className="mt-2 text-lg font-black uppercase text-sand">PostgreSQL Remoto</p>
              <p className="mt-2 text-sm leading-6 text-mist">
                Preparado para usar `DATABASE_URL` externa sin depender de `localhost`.
              </p>
            </div>
            <div className="rounded-[28px] border border-line bg-ink/65 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-mist">Producción</p>
              <p className="mt-2 text-lg font-black uppercase text-sand">Prisma Seguro</p>
              <p className="mt-2 text-sm leading-6 text-mist">
                La carga de sesión y de catálogo ahora degrada con fallback en lugar de
                romper el render inicial.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-mist">Home</p>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
              Productos destacados
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-sm font-semibold text-neon transition hover:text-neon/80"
          >
            Ver catálogo completo
          </Link>
        </div>

        {featuredProducts === null ? (
          <StatusCard
            eyebrow="Catálogo"
            title="La home sigue disponible aunque el catálogo no haya cargado."
            description="La conexión con la base de datos no respondió al consultar los productos destacados. El resto de la home queda operativo mientras se restablece la conexión."
            actions={[{ href: "/catalogo", label: "Reintentar catálogo" }]}
          />
        ) : featuredProducts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                requiresLogin={!user}
              />
            ))}
          </div>
        ) : (
          <StatusCard
            eyebrow="Catálogo"
            title="Todavía no hay productos destacados publicados."
            description="La home ya está operativa en `/`. Cuando cargues productos destacados van a aparecer automáticamente en esta sección."
            actions={[{ href: "/catalogo", label: "Ir al catálogo" }]}
          />
        )}
      </section>
    </div>
  );
}
