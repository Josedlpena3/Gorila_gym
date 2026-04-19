import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listCatalogProducts } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await listCatalogProducts({
      q: searchParams.get("q") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      objective: searchParams.get("objective") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
