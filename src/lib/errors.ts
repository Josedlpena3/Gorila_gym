import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      env.nodeEnv === "production"
        ? {
            error: error.message
          }
        : {
            error: error.message,
            details: error.details
          },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const details = error.flatten();
    const firstFieldError = Object.values(details.fieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));
    const firstFormError = details.formErrors.find(Boolean);

    return NextResponse.json(
      env.nodeEnv === "production"
        ? {
            error: firstFieldError ?? firstFormError ?? "Datos inválidos"
          }
        : {
            error: firstFieldError ?? firstFormError ?? "Datos inválidos",
            details
          },
      { status: 400 }
    );
  }

  if (env.nodeEnv !== "production") {
    console.error(error);
  } else {
    console.error("[route_error]", {
      message: error instanceof Error ? error.message : "unknown_error"
    });
  }

  return NextResponse.json(
    {
      error: "Error interno del servidor"
    },
    { status: 500 }
  );
}
