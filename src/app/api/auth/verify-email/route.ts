import { NextResponse } from "next/server";
import { AppError, handleRouteError } from "@/lib/errors";
import { verifyEmailByToken } from "@/modules/auth/auth.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() ?? "";

    if (!token) {
      throw new AppError("Falta el token de verificación.", 400);
    }

    const result = await verifyEmailByToken(token);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
