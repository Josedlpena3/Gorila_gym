import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  getSiteConfig,
  upsertSiteConfig
} from "@/modules/site-config/site-config.service";
import { requireAdminUser } from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminUser();
    const siteConfig = await getSiteConfig();

    return NextResponse.json(siteConfig);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const siteConfig = await upsertSiteConfig(body, admin.id);

    return NextResponse.json(siteConfig);
  } catch (error) {
    return handleRouteError(error);
  }
}
