import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { listUsers } from "@/modules/users/user.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const users = await listUsers();

    return NextResponse.json(users);
  } catch (error) {
    return handleRouteError(error);
  }
}
