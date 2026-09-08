import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { AppError } from "@/lib/errors";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";
import {
  createGuestOrder,
  createOrderFromCart,
  listOrdersByUser
} from "@/modules/orders/order.service";
import { getCurrentUser, requireCurrentUser } from "@/modules/users/user.service";

async function guardGuestOrderRequest(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent) {
    console.warn("[guest_order] request rejected", {
      reason: "missing_user_agent"
    });
    throw new AppError("Solicitud inválida", 400);
  }

  const ip = getRequestIp(request.headers);
  const rateLimit = await consumeRateLimit({
    key: ip,
    prefix: "guest-order:ip",
    limit: 5,
    windowMs: 60_000
  });

  if (rateLimit.limited) {
    console.warn("[guest_order] request rejected", {
      reason: "too_many_requests",
      ip
    });
    throw new AppError(
      "Demasiados pedidos seguidos. Esperá unos segundos e intentá otra vez.",
      429
    );
  }
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const orders = await listOrdersByUser(user.id);

    return NextResponse.json(orders);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();
    if (!user) {
      await guardGuestOrderRequest(request);
    }

    const result = user ? await createOrderFromCart(user, body) : await createGuestOrder(body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
