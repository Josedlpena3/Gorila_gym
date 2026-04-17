import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import { changePasswordForUser } from "@/modules/auth/auth.service";
import { requireCurrentUser } from "@/modules/users/user.service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const result = await changePasswordForUser(user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
