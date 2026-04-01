import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { getCheckoutQuote } from "@/modules/orders/order.service";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const cart = await getCartByUserId(user.id);
    const quote = await getCheckoutQuote(user, cart, body);

    return NextResponse.json(quote);
  } catch (error) {
    return handleRouteError(error);
  }
}
