import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getCartByUserId } from "@/modules/cart/cart.service";
import { requireCurrentUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const cart = await getCartByUserId(user.id);

    return NextResponse.json(cart);
  } catch (error) {
    return handleRouteError(error);
  }
}
