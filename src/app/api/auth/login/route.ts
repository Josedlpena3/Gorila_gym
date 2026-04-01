import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { handleRouteError } from "@/lib/errors";
import { loginUser } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser(body);
    const token = createSessionToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role.key
    });

    setSessionCookie(token);

    return NextResponse.json({
      message: "Sesión iniciada",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.key
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

