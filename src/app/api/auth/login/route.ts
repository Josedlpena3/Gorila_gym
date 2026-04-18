import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { AppError, handleRouteError } from "@/lib/errors";
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
        role: user.role.key,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 429) {
      const retryAfterSeconds =
        typeof error.details === "object" &&
        error.details !== null &&
        "retryAfterSeconds" in error.details &&
        typeof error.details.retryAfterSeconds === "number"
          ? Math.max(Math.ceil(error.details.retryAfterSeconds), 1)
          : 300;

      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": `${retryAfterSeconds}`
          }
        }
      );
    }

    return handleRouteError(error);
  }
}
