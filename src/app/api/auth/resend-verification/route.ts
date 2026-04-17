import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { resendEmailVerification } from "@/modules/auth/auth.service";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const result = await resendEmailVerification(user.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
