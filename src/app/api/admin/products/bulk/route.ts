import { NextResponse } from "next/server";
import { AppError, handleRouteError } from "@/lib/errors";
import { bulkCreateProducts } from "@/modules/products/product.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("POST bulk endpoint hit");
    const admin = await requireAdminUser();
    let data: unknown;

    try {
      data = await req.json();
    } catch {
      throw new AppError("Datos inválidos", 400);
    }

    const result = await bulkCreateProducts(data, admin.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
