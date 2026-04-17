import type { Transporter } from "nodemailer";
import { env } from "@/lib/env";

export type SendEmailResult =
  | {
      ok: true;
      messageId: string;
    }
  | {
      ok: false;
      error: string;
    };

export type EmailConfigDebugInfo = {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  fromAddress: string | null;
  provided: {
    host: boolean;
    port: boolean;
    secure: boolean;
    user: boolean;
    pass: boolean;
    fromAddress: boolean;
  };
  missing: string[];
};

let transportPromise: Promise<Transporter> | null = null;

function buildFromAddress() {
  const fromAddress = env.mailFromAddress || env.emailUser;

  if (!fromAddress) {
    return "";
  }

  return env.mailFromName
    ? `"${env.mailFromName}" <${fromAddress}>`
    : fromAddress;
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function maskEmail(value: string) {
  const [local, domain] = value.split("@");

  if (!domain) {
    return "configurado";
  }

  return `${local.slice(0, 2) || "*"}***@${domain}`;
}

export function getEmailConfigDebugInfo(): EmailConfigDebugInfo {
  const missing: string[] = [];
  const provided = {
    host: Boolean((process.env.EMAIL_HOST || process.env.SMTP_HOST)?.trim()),
    port: Boolean((process.env.EMAIL_PORT || process.env.SMTP_PORT)?.trim()),
    secure: Boolean((process.env.EMAIL_SECURE || process.env.SMTP_SECURE)?.trim()),
    user: Boolean((process.env.EMAIL_USER || process.env.SMTP_USER)?.trim()),
    pass: Boolean((process.env.EMAIL_PASS || process.env.SMTP_PASSWORD)?.trim()),
    fromAddress: Boolean(
      (process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER || process.env.SMTP_USER)?.trim()
    )
  };

  if (!provided.host) {
    missing.push("EMAIL_HOST");
  }

  if (!provided.port) {
    missing.push("EMAIL_PORT");
  }

  if (!provided.secure) {
    missing.push("EMAIL_SECURE");
  }

  if (!provided.user) {
    missing.push("EMAIL_USER");
  }

  if (!provided.pass) {
    missing.push("EMAIL_PASS");
  }

  const fromAddress = env.mailFromAddress || env.emailUser;

  if (!provided.fromAddress) {
    missing.push("MAIL_FROM_ADDRESS");
  }

  return {
    configured: missing.length === 0,
    host: env.emailHost || null,
    port: env.emailPort ?? null,
    secure: env.emailSecure,
    user: env.emailUser ? maskEmail(env.emailUser) : null,
    fromAddress: fromAddress ? maskEmail(fromAddress) : null,
    provided,
    missing
  };
}

export function emailIsConfigured() {
  return getEmailConfigDebugInfo().configured;
}

async function getTransporter() {
  if (!transportPromise) {
    transportPromise = (async () => {
      const nodemailer = await import("nodemailer");
      const config = getEmailConfigDebugInfo();

      console.info(
        `[email] inicializando transporter SMTP`,
        JSON.stringify(config)
      );

      const transporter = nodemailer.createTransport({
        host: env.emailHost,
        port: env.emailPort ?? 465,
        secure: env.emailSecure,
        auth: {
          user: env.emailUser,
          pass: env.emailPass
        }
      });

      await transporter.verify();

      console.info(
        `[email] transporter SMTP inicializado correctamente`,
        JSON.stringify(config)
      );

      return transporter;
    })();
  }

  try {
    return await transportPromise;
  } catch (error) {
    transportPromise = null;
    throw error;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const config = getEmailConfigDebugInfo();

  if (!config.configured) {
    const error =
      "Email SMTP no configurado. Definí EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER y EMAIL_PASS.";

    console.error(`[email] ${error}`, JSON.stringify(config));

    return {
      ok: false,
      error
    };
  }

  try {
    console.info(`[email] Intentando enviar email a: ${to}`);

    const transporter = await getTransporter();
    const result = await transporter.sendMail({
      from: buildFromAddress(),
      to,
      subject,
      html,
      text: htmlToText(html)
    });

    console.info(
      `[email] Email enviado correctamente`,
      JSON.stringify({
        to,
        subject,
        messageId: result.messageId
      })
    );

    return {
      ok: true,
      messageId: result.messageId
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al enviar email";

    console.error(
      `[email] Error al enviar email`,
      JSON.stringify({
        to,
        subject,
        error: message
      })
    );
    console.error(error);

    return {
      ok: false,
      error: message
    };
  }
}
