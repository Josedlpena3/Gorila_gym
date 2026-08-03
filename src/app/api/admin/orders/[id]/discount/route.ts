import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  applyManualOrderDiscount,
  parseAdminOrderDiscountUpdate,
  updateOrderDiscount
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
    const body = parseAdminOrderDiscountUpdate(await request.json());

    if (body.manualPercent !== undefined && body.manualPercent !== null) {
      const order = await applyManualOrderDiscount(params.id, body.manualPercent, admin.id);
      return NextResponse.json(order);
    }

    const order = await updateOrderDiscount(
      params.id,
      { discountCode: body.discountCode ?? null },
      admin.id
    );
    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
