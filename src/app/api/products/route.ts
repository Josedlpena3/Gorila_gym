import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listCatalogProducts } from "@/modules/products/product.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const result = await listCatalogProducts({
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      objective: searchParams.get("objective") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

