import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listCategories } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listCategories();

    return NextResponse.json(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}
