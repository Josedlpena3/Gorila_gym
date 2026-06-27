import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError } from "@/lib/errors";
import {
  deleteProduct,
  patchProductStock,
  updateProduct
} from "@/modules/products/product.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const product = await updateProduct(params.id, body, admin.id);

    return NextResponse.json(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const stock = z.coerce.number().int().min(0, "Stock inválido").parse(body.stock);
    const product = await patchProductStock(params.id, stock);

    return NextResponse.json(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const result = await deleteProduct(params.id, admin.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
