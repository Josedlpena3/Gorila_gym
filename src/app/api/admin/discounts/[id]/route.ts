import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  deleteDiscount,
  updateDiscount
} from "@/modules/discounts/discount.service";
import { requireAdminUser } from "@/modules/users/user.service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const discount = await updateDiscount(params.id, body, admin.id);

    return NextResponse.json(discount);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    await deleteDiscount(params.id, admin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
