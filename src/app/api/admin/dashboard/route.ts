import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getAdminDashboard } from "@/modules/dashboard/dashboard.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const dashboard = await getAdminDashboard();

    return NextResponse.json(dashboard);
  } catch (error) {
    return handleRouteError(error);
  }
}
