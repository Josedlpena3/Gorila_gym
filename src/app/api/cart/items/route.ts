import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity
} from "@/modules/cart/cart.service";
import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema
} from "@/modules/cart/cart.schemas";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = addCartItemSchema.parse(await request.json());
    const cart = await addCartItem(user.id, body.productId, body.quantity);

    return NextResponse.json(cart);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = updateCartItemSchema.parse(await request.json());
    const cart = await updateCartItemQuantity(user.id, body.productId, body.quantity);

    return NextResponse.json(cart);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = removeCartItemSchema.parse(await request.json());
    const cart = await removeCartItem(user.id, body.productId);

    return NextResponse.json(cart);
  } catch (error) {
    return handleRouteError(error);
  }
}
