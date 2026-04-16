import Image from "next/image";
import Link from "next/link";
import { CartItemControls } from "@/components/cart/cart-item-controls";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-2xl p-6 text-center sm:p-10">
          <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-3xl">
            Ingresá para ver tu carrito
          </h1>
          <p className="mt-4 text-mist">
            El carrito se guarda por usuario para que puedas retomar tu compra cuando quieras.
          </p>
          <Link href="/login?next=/carrito" className="mt-6 inline-flex">
            <Button>Ir al login</Button>
          </Link>
        </div>
      </div>
    );
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
              <article
                key={item.id}
                className="grid grid-cols-[96px,1fr] gap-4 rounded-[28px] border border-line bg-ink/60 p-4 sm:grid-cols-[120px,1fr]"
              >
                <div className="relative h-24 overflow-hidden rounded-3xl sm:h-28">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-mist">{item.brand}</p>
                    <h2 className="mt-2 text-lg font-semibold leading-tight text-sand sm:text-xl">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-sm text-mist">
                      Stock disponible: {item.stock} unidades
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <CartItemControls
                      productId={item.productId}
                      quantity={item.quantity}
                      stock={item.stock}
                    />
                    <p className="text-xl font-black text-sand">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              </article>
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
