import { handleRouteError } from "@/lib/errors";
import { getOrCreateSiteConfig } from "@/modules/site-config/site-config.service";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("site-config endpoint hit");

  try {
    const siteConfig = await getOrCreateSiteConfig();

    return Response.json({
      ok: true,
      ...siteConfig
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
