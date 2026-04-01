import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { resetPasswordByToken } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resetPasswordByToken(body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

