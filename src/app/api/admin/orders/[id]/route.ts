import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { parseAdminOrderAction, updateOrderStatus } from "@/modules/orders/order.service";
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
    const order = await updateOrderStatus(params.id, { status: body.status }, admin.id);

    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
