import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { getSiteConfig } from "@/modules/site-config/site-config.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const siteConfig = await getSiteConfig();

    return NextResponse.json(siteConfig);
  } catch (error) {
    return handleRouteError(error);
  }
}
