import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listAllOrders } from "@/modules/orders/order.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const orders = await listAllOrders();

    return NextResponse.json(orders);
  } catch (error) {
    return handleRouteError(error);
  }
}
