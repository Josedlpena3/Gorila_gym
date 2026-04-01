import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  createProduct,
  getAdminProducts
} from "@/modules/products/product.service";
import { requireAdminUser } from "@/modules/users/user.service";

export async function GET() {
  try {
    await requireAdminUser();
    const products = await getAdminProducts();

    return NextResponse.json(products);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const product = await createProduct(body, admin.id);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

