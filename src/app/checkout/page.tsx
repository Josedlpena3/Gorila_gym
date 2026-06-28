import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getBankTransferConfig, getStorePickupAddress } from "@/lib/store-config";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const cart = user ? await getCartByUserId(user.id) : null;
  const transferConfig = getBankTransferConfig();
  const pickupAddress = getStorePickupAddress();

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Checkout</p>
        <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
          Confirmá tu compra
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mist sm:text-base">
          Elegí entrega y forma de pago. Te contactamos por WhatsApp para coordinar y confirmar tu pedido.
        </p>
      </div>
      <CheckoutForm
        user={user}
        cart={cart}
        pickupAvailable={Boolean(pickupAddress)}
        transferAvailable={Boolean(transferConfig)}
        transferConfig={
          transferConfig
            ? {
                alias: transferConfig.alias,
                cbu: transferConfig.cbu,
                accountHolder: transferConfig.accountHolder
              }
            : null
        }
      />
    </div>
  );
}
