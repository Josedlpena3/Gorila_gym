import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const cart = await getCartByUserId(user.id);

  if (cart.items.length === 0) {
    redirect("/catalogo");
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Checkout</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
          Confirmá tu compra
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mist sm:text-base">
          Revisamos el pedido y te escribimos por WhatsApp para coordinar la entrega.
        </p>
        {!user.emailVerified ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-200">
            Antes de comprar necesitás verificar tu email. Podés reenviar el correo desde
            el aviso superior.
          </p>
        ) : null}
      </div>
      <CheckoutForm user={user} cart={cart} />
    </div>
  );
}
