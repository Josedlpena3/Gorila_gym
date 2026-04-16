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

function getAdminNotificationRecipients() {
  return env.orderNotificationEmails;
}

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
    PENDING_CONFIRMATION: "pendiente de confirmación",
    CONTACTED: "ya coordinado por WhatsApp",
    DELIVERED: "entregado",
    CANCELLED: "cancelado"
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
    } Te vamos a contactar por WhatsApp para coordinar la entrega.`,
    html: `<p>Hola ${input.firstName},</p><p>Registramos tu pedido <strong>${
      input.order.code
    }</strong> por <strong>${totalLabel}</strong>.</p><p>Te vamos a contactar por WhatsApp para coordinar la entrega.</p>${
      orderUrl ? `<p><a href="${orderUrl}">Ver pedido</a></p>` : ""
    }`
  });
}

export async function sendAdminOrderNotificationEmail(input: {
  order: NotificationOrder;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    number: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
}) {
  const recipients = getAdminNotificationRecipients();

  if (recipients.length === 0) {
    return false;
  }

  const customerName = `${input.customer.firstName} ${input.customer.lastName}`;
  const itemsText = input.items.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
  const itemsHtml = input.items
    .map((item) => `<li>${item.name} x${item.quantity}</li>`)
    .join("");

  return sendMail({
    to: recipients.join(", "),
    subject: `Nuevo pedido ${input.order.code}`,
    text: `Nuevo pedido ${input.order.code}.

Cliente: ${customerName}
Email: ${input.customer.email}
Celular: ${input.customer.phone}
Dirección: ${input.address.street} ${input.address.number}, ${input.address.city}, ${input.address.province}, CP ${input.address.postalCode}

Productos:
${itemsText}

Contactar al cliente por WhatsApp para coordinar.`,
    html: `<p>Nuevo pedido <strong>${input.order.code}</strong>.</p>
<p><strong>Cliente:</strong> ${customerName}<br />
<strong>Email:</strong> ${input.customer.email}<br />
<strong>Celular:</strong> ${input.customer.phone}</p>
<p><strong>Dirección:</strong> ${input.address.street} ${input.address.number}, ${input.address.city}, ${input.address.province}, CP ${input.address.postalCode}</p>
<p><strong>Productos:</strong></p>
<ul>${itemsHtml}</ul>
<p>Contactar al cliente por WhatsApp para coordinar.</p>`
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
