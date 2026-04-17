import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { handleRouteError } from "@/lib/errors";
import { registerUser } from "@/modules/auth/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);
    const user = result.user;
    const token = createSessionToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role.key
    });

    setSessionCookie(token);

    return NextResponse.json({
      message: "Cuenta creada correctamente",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.key,
        emailVerified: user.emailVerified
      },
      verificationLink: result.verificationLink,
      emailError: result.emailError
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
