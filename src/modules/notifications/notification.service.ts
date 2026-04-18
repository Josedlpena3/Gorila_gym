import { OrderStatus } from "@prisma/client";
import { emailIsConfigured, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";

type NotificationOrder = {
  id: string;
  code: string;
  total?: number;
  status: OrderStatus;
};

function getAdminNotificationRecipients() {
  return env.orderNotificationEmails;
}

function buildActionButton(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#b7ff39;color:#0a0b0d;font-weight:800;text-decoration:none;">${label}</a>`;
}

function buildEmailShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  actionUrl: string;
  actionLabel: string;
  fallbackLabel?: string;
  showPlainLink?: boolean;
  footer: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${input.title}</title>
      </head>
      <body style="margin:0;padding:32px 16px;background:#0a0b0d;font-family:Arial,sans-serif;color:#f5f1e8;">
        <div style="max-width:560px;margin:0 auto;background:#11151d;border:1px solid rgba(255,255,255,0.08);border-radius:28px;overflow:hidden;">
          <div style="padding:32px;">
            <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#9aa4b2;">${input.eyebrow}</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f5f1e8;">${input.title}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c3cad5;">${input.intro}</p>
            <div style="margin:0 0 24px;">${buildActionButton(input.actionUrl, input.actionLabel)}</div>
            ${
              input.showPlainLink === false || !input.fallbackLabel
                ? ""
                : `
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#c3cad5;">${input.fallbackLabel}</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
              <a href="${input.actionUrl}" style="color:#b7ff39;text-decoration:none;">${input.actionUrl}</a>
            </p>`
            }
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9aa4b2;">${input.footer}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim();
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
  const html = buildEmailShell({
    eyebrow: "Recuperación",
    title: `Hola ${input.firstName}, restablecé tu contraseña`,
    intro:
      "Recibimos una solicitud para recuperar el acceso a tu cuenta. Usá el botón de abajo para definir una nueva contraseña.",
    actionUrl: input.resetUrl,
    actionLabel: "Restablecer contraseña",
    showPlainLink: false,
    footer: `Este enlace vence ${formatDate(input.expiresAt)} y solo puede usarse una vez.`
  });

  return sendEmail(
    input.email,
    "Recuperación de contraseña - Gorila Strong",
    html
  );
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  firstName: string;
  verificationUrl: string;
  expiresAt: Date;
}) {
  const html = buildEmailShell({
    eyebrow: "Verificación",
    title: `Hola ${input.firstName}, verificá tu cuenta`,
    intro:
      "Para activar tu cuenta y poder completar compras, confirmá tu email desde el siguiente botón.",
    actionUrl: input.verificationUrl,
    actionLabel: "Verificar email",
    showPlainLink: false,
    footer: `Este enlace vence ${formatDate(input.expiresAt)} y solo puede usarse una vez.`
  });

  return sendEmail(input.email, "Verificá tu email - Gorila Strong", html);
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

  return sendEmail(
    input.email,
    `Pedido ${input.order.code} recibido`,
    `<p>Hola ${input.firstName},</p><p>Registramos tu pedido <strong>${
      input.order.code
    }</strong> por <strong>${totalLabel}</strong>.</p><p>Te vamos a contactar por WhatsApp para coordinar la entrega.</p>${
      orderUrl ? `<p><a href="${orderUrl}">Ver pedido</a></p>` : ""
    }`
  );
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
  const itemsHtml = input.items
    .map((item) => `<li>${item.name} x${item.quantity}</li>`)
    .join("");

  return sendEmail(
    recipients.join(", "),
    `Nuevo pedido ${input.order.code}`,
    `<p>Nuevo pedido <strong>${input.order.code}</strong>.</p>
<p><strong>Cliente:</strong> ${customerName}<br />
<strong>Email:</strong> ${input.customer.email}<br />
<strong>Celular:</strong> ${input.customer.phone}</p>
<p><strong>Dirección:</strong> ${input.address.street} ${input.address.number}, ${input.address.city}, ${input.address.province}, CP ${input.address.postalCode}</p>
<p><strong>Productos:</strong></p>
<ul>${itemsHtml}</ul>
<p>Contactar al cliente por WhatsApp para coordinar.</p>`
  );
}

export async function sendPaymentApprovedEmail(input: {
  email: string;
  firstName: string;
  order: NotificationOrder;
}) {
  const orderUrl = buildOrdersUrl(input.order.id);

  return sendEmail(
    input.email,
    `Pago aprobado para ${input.order.code}`,
    `<p>Hola ${input.firstName},</p><p>Confirmamos el pago de tu pedido <strong>${
      input.order.code
    }</strong>.</p>${orderUrl ? `<p><a href="${orderUrl}">Ver seguimiento</a></p>` : ""}`
  );
}

export async function sendOrderStatusChangedEmail(input: {
  email: string;
  firstName: string;
  order: NotificationOrder;
  previousStatus: OrderStatus;
}) {
  const orderUrl = buildOrdersUrl(input.order.id);

  return sendEmail(
    input.email,
    `Actualización de estado para ${input.order.code}`,
    `<p>Hola ${input.firstName},</p><p>Tu pedido <strong>${
      input.order.code
    }</strong> pasó de <strong>${orderStatusLabel(
      input.previousStatus
    )}</strong> a <strong>${orderStatusLabel(input.order.status)}</strong>.</p>${
      orderUrl ? `<p><a href="${orderUrl}">Ver pedido</a></p>` : ""
    }`
  );
}

export function notificationsAreConfigured() {
  return emailIsConfigured();
}
