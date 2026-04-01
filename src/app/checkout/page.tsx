import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import { getAvailableDeliveryMethods } from "@/lib/store-config";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const cart = await getCartByUserId(user.id);
  const deliveryOptions = getAvailableDeliveryMethods();

  if (cart.items.length === 0) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
            No hay productos para comprar
          </h1>
          <p className="mt-4 text-mist">
            Sumá productos al carrito antes de iniciar el checkout.
          </p>
          <Link href="/catalogo" className="mt-6 inline-flex">
            <Button>Ir al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (deliveryOptions.methods.length === 0) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
            Checkout no disponible
          </h1>
          <p className="mt-4 text-mist">
            Falta configurar al menos una modalidad de entrega y el costo operativo
            correspondiente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Checkout</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Confirmá tu compra
        </h1>
      </div>
      <CheckoutForm
        user={user}
        cart={cart}
        deliveryOptions={deliveryOptions}
      />
    </div>
  );
}
