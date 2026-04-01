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
        <div className="section-card mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
            Ingresá para ver tu carrito
          </h1>
          <p className="mt-4 text-mist">
            El carrito se guarda por usuario para mantener stock y checkout sincronizados.
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
        <div className="section-card mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
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
    <div className="page-shell grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
      <section className="section-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-mist">Carrito</p>
            <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
              Tu selección
            </h1>
          </div>
          <p className="text-sm text-mist">{cart.itemCount} unidades</p>
        </div>

        <div className="mt-6 space-y-4">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-[28px] border border-line bg-ink/60 p-4 md:grid-cols-[140px,1fr]"
            >
              <div className="relative h-32 overflow-hidden rounded-3xl">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-mist">{item.brand}</p>
                  <h2 className="mt-2 text-xl font-semibold text-sand">{item.name}</h2>
                  <p className="mt-2 text-sm text-mist">
                    Stock disponible: {item.stock} unidades
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
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

      <aside className="section-card h-fit p-6">
        <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-sand">
          Resumen
        </h2>
        <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
          <div className="flex items-center justify-between text-mist">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-mist">
            <span>Entrega</span>
            <span>Se calcula en checkout</span>
          </div>
          <div className="flex items-center justify-between text-xl font-black text-sand">
            <span>Total estimado</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
        </div>
        <Link href="/checkout" className="mt-6 inline-flex w-full">
          <Button className="w-full">Continuar al checkout</Button>
        </Link>
      </aside>
    </div>
  );
}

