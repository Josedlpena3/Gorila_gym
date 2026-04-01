import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getOrderById } from "@/modules/orders/order.service";
import { requireCurrentUser } from "@/modules/users/user.service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const order = await getOrderById(params.id, user.id);

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}

