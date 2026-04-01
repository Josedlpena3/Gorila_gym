import { OrderStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";

type NotificationOrder = {
  id: string;
  code: string;
  total?: number;
  status: OrderStatus;
};

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function isSmtpConfigured() {
  return Boolean(
    env.notificationProvider.toLowerCase() === "smtp" &&
      env.smtpHost &&
      env.smtpPort &&
      env.mailFromAddress
  );
}

function buildFromAddress() {
  if (!env.mailFromAddress) {
    return "";
  }

  return env.mailFromName
    ? `"${env.mailFromName}" <${env.mailFromAddress}>`
    : env.mailFromAddress;
}

async function sendMail(payload: MailPayload) {
  if (!isSmtpConfigured()) {
    return false;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort!,
    secure: env.smtpSecure,
    auth:
      env.smtpUser && env.smtpPassword
        ? {
            user: env.smtpUser,
            pass: env.smtpPassword
          }
        : undefined
  });

  await transporter.sendMail({
    from: buildFromAddress(),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });

  return true;
}

function buildOrdersUrl(orderId: string) {
  if (!env.appUrl) {
    return "";
  }

  return `${env.appUrl}/mis-pedidos?highlight=${orderId}`;
}

function orderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING_PAYMENT: "pendiente de pago",
    PENDING_VERIFICATION: "pendiente de verificación",
    PAID: "pagado",
    PREPARING: "preparando",
    SHIPPED: "enviado",
    DELIVERED: "entregado",
    CANCELED: "cancelado"
  };

  return labels[status];
}

export async function sendPasswordResetEmail(input: {
  email: string;
  firstName: string;
  resetUrl: string;
  expiresAt: Date;
}) {
  return sendMail({
    to: input.email,
    subject: "Recuperación de contraseña - Gorila Strong",
    text: `Hola ${input.firstName}, restablecé tu contraseña desde ${input.resetUrl}. El enlace vence ${formatDate(
      input.expiresAt
    )}.`,
    html: `<p>Hola ${input.firstName},</p><p>Podés restablecer tu contraseña desde este enlace:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p><p>El enlace vence ${formatDate(
      input.expiresAt
    )}.</p>`
  });
}

export async function sendOrderCreatedEmail(input: {
  email: string;
  firstName: string;
  order: NotificationOrder;
}) {
  const orderUrl = buildOrdersUrl(input.order.id);
  const totalLabel =
    typeof input.order.total === "number"
      ? formatCurrency(input.order.total)
      : "importe pendiente";

  return sendMail({
    to: input.email,
    subject: `Pedido ${input.order.code} recibido`,
    text: `Hola ${input.firstName}, registramos tu pedido ${input.order.code} por ${totalLabel}. ${
      orderUrl ? `Podés seguirlo en ${orderUrl}.` : ""
    }`,
    html: `<p>Hola ${input.firstName},</p><p>Registramos tu pedido <strong>${
      input.order.code
    }</strong> por <strong>${totalLabel}</strong>.</p>${
      orderUrl ? `<p><a href="${orderUrl}">Ver pedido</a></p>` : ""
    }`
  });
}

export async function sendPaymentApprovedEmail(input: {
  email: string;
  firstName: string;
  order: NotificationOrder;
}) {
  const orderUrl = buildOrdersUrl(input.order.id);

  return sendMail({
    to: input.email,
    subject: `Pago aprobado para ${input.order.code}`,
    text: `Hola ${input.firstName}, confirmamos el pago de tu pedido ${
      input.order.code
    }. ${orderUrl ? `Seguimiento: ${orderUrl}` : ""}`,
    html: `<p>Hola ${input.firstName},</p><p>Confirmamos el pago de tu pedido <strong>${
      input.order.code
    }</strong>.</p>${orderUrl ? `<p><a href="${orderUrl}">Ver seguimiento</a></p>` : ""}`
  });
}

export async function sendOrderStatusChangedEmail(input: {
  email: string;
  firstName: string;
  order: NotificationOrder;
  previousStatus: OrderStatus;
}) {
  const orderUrl = buildOrdersUrl(input.order.id);

  return sendMail({
    to: input.email,
    subject: `Actualización de estado para ${input.order.code}`,
    text: `Hola ${input.firstName}, tu pedido ${input.order.code} pasó de ${orderStatusLabel(
      input.previousStatus
    )} a ${orderStatusLabel(input.order.status)}. ${
      orderUrl ? `Detalle: ${orderUrl}` : ""
    }`,
    html: `<p>Hola ${input.firstName},</p><p>Tu pedido <strong>${
      input.order.code
    }</strong> pasó de <strong>${orderStatusLabel(
      input.previousStatus
    )}</strong> a <strong>${orderStatusLabel(input.order.status)}</strong>.</p>${
      orderUrl ? `<p><a href="${orderUrl}">Ver pedido</a></p>` : ""
    }`
  });
}

export function notificationsAreConfigured() {
  return isSmtpConfigured();
}
