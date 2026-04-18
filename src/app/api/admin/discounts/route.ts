import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  createDiscount,
  listDiscounts
} from "@/modules/discounts/discount.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const discounts = await listDiscounts();

    return NextResponse.json(discounts);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const discount = await createDiscount(body, admin.id);

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
