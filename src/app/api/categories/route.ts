import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listCategories } from "@/modules/products/product.service";

export const revalidate = 3600;

export async function GET() {
  try {
    const categories = await listCategories();

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
