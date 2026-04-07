import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
      {
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
      {
        error: firstFieldError ?? firstFormError ?? "Datos inválidos",
        details
      },
      { status: 400 }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: "Error interno del servidor"
    },
    { status: 500 }
  );
}
