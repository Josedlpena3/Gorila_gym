import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  syncMercadoPagoPayment,
  validateMercadoPagoWebhookSignature
} from "@/modules/payments/payment.service";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const type = body.type ?? searchParams.get("type");
    const paymentId =
      body.data?.id ??
      searchParams.get("data.id") ??
      searchParams.get("id");

    if (type === "payment" && paymentId) {
      const isValidSignature = validateMercadoPagoWebhookSignature({
        request,
        dataId: String(paymentId)
      });

      if (!isValidSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      await syncMercadoPagoPayment(String(paymentId));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
