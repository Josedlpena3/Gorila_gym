import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailConfigDebugInfo, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { AppError, handleRouteError } from "@/lib/errors";
import { requireAdminUser } from "@/modules/users/user.service";

const testEmailSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido")
});

function buildTestEmailHtml(actionUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Prueba de email</title>
      </head>
      <body style="margin:0;padding:32px 16px;background:#0a0b0d;font-family:Arial,sans-serif;color:#f5f1e8;">
        <div style="max-width:560px;margin:0 auto;background:#11151d;border:1px solid rgba(255,255,255,0.08);border-radius:28px;overflow:hidden;">
          <div style="padding:32px;">
            <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#9aa4b2;">SMTP Gmail</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f5f1e8;">Prueba de envío</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c3cad5;">
              Este email confirma que el mailer de Gorila Strong pudo conectarse y enviar correctamente usando Gmail SMTP.
            </p>
            <div style="margin:0 0 24px;">
              <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#b7ff39;color:#0a0b0d;font-weight:800;text-decoration:none;">
                Abrir Gorila Strong
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#c3cad5;">Si el botón no funciona, usá este enlace:</p>
            <p style="margin:0;font-size:14px;line-height:1.6;word-break:break-all;">
              <a href="${actionUrl}" style="color:#b7ff39;text-decoration:none;">${actionUrl}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
}

export async function POST(request: Request) {
  try {
    if (env.nodeEnv === "production") {
      await requireAdminUser();
    }

    const body = await request.json();
    const data = testEmailSchema.parse(body);
    const appUrl = env.appUrl || "http://localhost:3000";

    if (!appUrl) {
      throw new AppError("NEXT_PUBLIC_APP_URL no está configurada.", 500);
    }

    const result = await sendEmail(
      data.email,
      "Prueba de email - Gorila Strong",
      buildTestEmailHtml(appUrl)
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo enviar el email de prueba.",
          error: result.error,
          config: getEmailConfigDebugInfo()
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Email de prueba enviado correctamente.",
      messageId: result.messageId,
      config: getEmailConfigDebugInfo()
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
