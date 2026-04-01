import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  deleteProduct,
  updateProduct
} from "@/modules/products/product.service";
import { requireAdminUser } from "@/modules/users/user.service";

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

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const result = await deleteProduct(params.id, admin.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

