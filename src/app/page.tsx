import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts, listCategories } from "@/modules/products/product.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function HomePage() {
  const [featuredProducts, categories, user] = await Promise.all([
    getFeaturedProducts(),
    listCategories(),
    getCurrentUser()
  ]);

  return (
    <div className="space-y-16">
      <section className="page-shell">
        <div className="mesh-line overflow-hidden rounded-[36px] border border-line bg-hero px-6 py-16 shadow-premium sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <Badge variant="success">Fitness premium desde Córdoba</Badge>
            <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[0.08em] text-sand sm:text-6xl">
              Construí fuerza real con suplementación inteligente.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-mist">
              Catálogo curado, checkout real con Mercado Pago, transferencia con
              descuento, stock reservado y panel de gestión listo para producción.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/catalogo">
                <Button className="gap-2">
                  Explorar catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/registro">
                <Button variant="secondary">Crear cuenta</Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Checkout robusto",
                text: "Mercado Pago, transferencia bancaria y efectivo restringido por zona.",
                icon: ShieldCheck
              },
              {
                title: "Operación ordenada",
                text: "Estados de pedido, reservas de stock, auditoría y confirmación manual.",
                icon: Sparkles
              },
              {
                title: "Entrega flexible",
                text: "Retiro en Córdoba o envíos con dirección persistente desde la cuenta.",
                icon: Truck
              }
            ].map((feature) => (
              <div key={feature.title} className="section-card p-5">
                <feature.icon className="h-6 w-6 text-neon" />
                <h2 className="mt-4 text-lg font-semibold text-sand">{feature.title}</h2>
                <p className="mt-2 text-sm text-mist">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-mist">Colección</p>
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
              Productos destacados
            </h2>
          </div>
          <Link href="/catalogo" className="text-sm font-semibold text-neon">
            Ver catálogo completo
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              requiresLogin={!user}
            />
          ))}
        </div>
      </section>

      <section className="page-shell">
        <div className="section-card grid gap-4 p-6 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogo?category=${category.slug}`}
              className="rounded-[28px] border border-line bg-ink/70 p-5 transition hover:border-neon/60"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-mist">Categoría</p>
              <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand">
                {category.name}
              </h3>
              <p className="mt-2 text-sm text-mist">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

