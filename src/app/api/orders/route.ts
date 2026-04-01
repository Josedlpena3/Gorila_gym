import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  createOrderFromCart,
  listOrdersByUser
} from "@/modules/orders/order.service";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const orders = await listOrdersByUser(user.id);

    return NextResponse.json(orders);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const result = await createOrderFromCart(user, body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

