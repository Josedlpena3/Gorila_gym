import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/errors";
import {
  getCurrentUser,
  requireCurrentUser,
  updateCurrentUserProfile
} from "@/modules/users/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    await updateCurrentUserProfile(user.id, body);
    const updated = await getCurrentUser();

    return NextResponse.json(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
