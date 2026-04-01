import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  confirmTransferPayment,
  parseAdminOrderAction,
  updateOrderStatus
} from "@/modules/orders/order.service";
import { requireAdminUser } from "@/modules/users/user.service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const body = parseAdminOrderAction(await request.json());

    if ("action" in body && body.action === "confirm-transfer") {
      const order = await confirmTransferPayment(params.id, admin.id);
      return NextResponse.json(order);
    }

    if (!("status" in body)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const order = await updateOrderStatus(params.id, body.status, admin.id);

    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
