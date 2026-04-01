import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleRouteError } from "@/lib/errors";
import { releaseExpiredOrders } from "@/modules/orders/order.service";

export async function POST(request: Request) {
  try {
    if (!env.cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET no configurado" },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const released = await releaseExpiredOrders();

    return NextResponse.json({
      released
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
