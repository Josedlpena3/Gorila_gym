import Link from "next/link";
import { CartItem } from "@/components/cart/cart-item";
import { GuestCartView } from "@/components/cart/guest-cart-view";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <GuestCartView />;
  }

  const cart = await getCartByUserId(user.id);

  if (cart.items.length === 0) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-2xl p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
            Tu carrito está vacío
          </h1>
          <p className="mt-4 text-mist">
            Explorá el catálogo y agregá suplementos para continuar.
          </p>
          <Link href="/catalogo" className="mt-6 inline-flex">
            <Button>Ir al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-4">
      <Link
        href="/catalogo"
        className="inline-flex items-center text-sm font-semibold text-sand transition hover:text-neon"
      >
        &larr; Volver a comprar
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr] lg:gap-6">
        <section className="section-card p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-mist">Carrito</p>
              <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
                Tu selección
              </h1>
            </div>
            <p className="text-sm text-mist">{cart.itemCount} unidades</p>
          </div>

          <div className="mt-6 space-y-4">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={{
                  id: item.id,
                  productId: item.productId,
                  name: item.name,
                  brand: item.brand,
                  image: item.image,
                  stock: item.stock,
                  quantity: item.quantity,
                  subtotal: item.subtotal
                }}
              />
            ))}
          </div>
        </section>

        <aside className="section-card h-fit p-4 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-sand sm:text-2xl">
            Resumen
          </h2>
          <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between text-mist">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-mist">
              <span>Entrega</span>
              <span>Se coordina por WhatsApp</span>
            </div>
            <div className="flex items-center justify-between text-xl font-black text-sand">
              <span>Total estimado</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
          </div>
          <Link href="/checkout" className="mt-6 inline-flex w-full">
            <Button className="min-h-[52px] w-full">Continuar con el pedido</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
