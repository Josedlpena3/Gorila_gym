import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { requestPasswordReset } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await requestPasswordReset(body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

