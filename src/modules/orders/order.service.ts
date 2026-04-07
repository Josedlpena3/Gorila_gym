import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  getAvailableDeliveryMethods,
  getBankTransferConfig,
  getReservationWindowMinutes,
  getShippingCost,
  getStorePickupAddress
} from "@/lib/store-config";
import { decimalToNumber, generateOrderCode, isCordobaProvince } from "@/lib/utils";
import { getCartByUserId } from "@/modules/cart/cart.service";
import {
  createOrderSchema,
  orderAdminActionSchema,
  orderStatusSchema,
  quoteCheckoutSchema
} from "@/modules/orders/order.schemas";
import {
  sendOrderCreatedEmail,
  sendOrderStatusChangedEmail,
  sendPaymentApprovedEmail
} from "@/modules/notifications/notification.service";
import {
  buildCheckoutPricing,
  buildPaymentMethodOptions,
  createMercadoPagoPreference,
  getAvailablePaymentMethods
} from "@/modules/payments/payment.service";
import type { CheckoutQuoteDto, OrderSummaryDto } from "@/types";

const orderInclude = {
  items: true,
  payment: true
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

type UserContext = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: Array<{
    id: string;
    label: string;
    recipientName: string;
    street: string;
    number: string;
    floor: string | null;
    apartment: string | null;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    notes: string | null;
    isDefault: boolean;
  }>;
};

type TransferMetadata = {
  alias: string;
  cbu: string;
  accountHolder: string;
  bankName?: string | null;
  instructions?: string | null;
  receipt?: {
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  } | null;
};

type PaymentMetadata = {
  preferenceId?: string | null;
  checkoutUrl?: string | null;
  mode?: string | null;
  transfer?: TransferMetadata | null;
};

function parsePaymentMetadata(metadata: Prisma.JsonValue | null): PaymentMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const record = metadata as Record<string, unknown>;
  const transferValue = record.transfer;
  const transfer =
    transferValue &&
    typeof transferValue === "object" &&
    !Array.isArray(transferValue)
      ? (transferValue as TransferMetadata)
      : null;

  return {
    preferenceId:
      typeof record.preferenceId === "string" ? record.preferenceId : null,
    checkoutUrl: typeof record.checkoutUrl === "string" ? record.checkoutUrl : null,
    mode: typeof record.mode === "string" ? record.mode : null,
    transfer
  };
}

function mapOrder(order: OrderRecord): OrderSummaryDto {
  const paymentMetadata = parsePaymentMetadata(order.payment?.metadata ?? null);

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,
    subtotal: decimalToNumber(order.subtotal) ?? 0,
    shippingCost: decimalToNumber(order.shippingCost) ?? 0,
    discountTotal: decimalToNumber(order.discountTotal) ?? 0,
    total: decimalToNumber(order.total) ?? 0,
    createdAt: order.createdAt.toISOString(),
    recipientName: order.recipientName,
    contactPhone: order.contactPhone,
    street: order.street,
    number: order.number,
    floor: order.floor,
    apartment: order.apartment,
    province: order.province,
    city: order.city,
    postalCode: order.postalCode,
    paymentStatus: order.payment?.status ?? PaymentStatus.PENDING,
    payment: {
      provider: order.payment?.provider ?? order.paymentMethod,
      status: order.payment?.status ?? PaymentStatus.PENDING,
      amount: decimalToNumber(order.payment?.amount) ?? decimalToNumber(order.total) ?? 0,
      dueAt: order.paymentDueAt?.toISOString() ?? null,
      paidAt: order.payment?.paidAt?.toISOString() ?? null,
      reference: order.payment?.externalReference ?? order.code,
      checkoutUrl: paymentMetadata.checkoutUrl ?? null,
      transfer: paymentMetadata.transfer
        ? {
            alias: paymentMetadata.transfer.alias,
            cbu: paymentMetadata.transfer.cbu,
            accountHolder: paymentMetadata.transfer.accountHolder,
            bankName: paymentMetadata.transfer.bankName ?? null,
            instructions: paymentMetadata.transfer.instructions ?? null,
            reference: order.payment?.externalReference ?? order.code,
            amount: decimalToNumber(order.payment?.amount) ?? decimalToNumber(order.total) ?? 0,
            expiresAt: order.paymentDueAt?.toISOString() ?? null,
            receipt: paymentMetadata.transfer.receipt
              ? {
                  url: paymentMetadata.transfer.receipt.url,
                  fileName: paymentMetadata.transfer.receipt.fileName,
                  mimeType: paymentMetadata.transfer.receipt.mimeType,
                  size: paymentMetadata.transfer.receipt.size,
                  uploadedAt: paymentMetadata.transfer.receipt.uploadedAt
                }
              : null
          }
        : null
    },
    items: order.items.map((item) => ({
      id: item.id,
      name: item.nameSnapshot,
      brand: item.brandSnapshot,
      quantity: item.quantity,
      price: decimalToNumber(item.price) ?? 0,
      subtotal: decimalToNumber(item.subtotal) ?? 0
    }))
  };
}

async function getOrderRecord(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude
  });
}

async function restockOrderItems(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId }
  });

  for (const item of items) {
    if (!item.productId) {
      continue;
    }

    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity
        }
      }
    });
  }
}

async function markOrderCanceled(tx: Prisma.TransactionClient, orderId: string) {
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELED
    }
  });

  await tx.payment.updateMany({
    where: {
      orderId,
      status: {
        not: PaymentStatus.APPROVED
      }
    },
    data: {
      status: PaymentStatus.CANCELED
    }
  });
}

async function rollbackMercadoPagoOrder(input: {
  orderId: string;
  cartId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });

      await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: input.cartId,
            productId: item.productId
          }
        },
        update: {
          quantity: {
            increment: item.quantity
          },
          unitPrice: item.unitPrice
        },
        create: {
          cartId: input.cartId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }
      });
    }

    await tx.payment.updateMany({
      where: {
        orderId: input.orderId
      },
      data: {
        status: PaymentStatus.CANCELED,
        metadata: {
          rollbackReason: "mercado_pago_preference_failed"
        }
      }
    });

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        status: OrderStatus.CANCELED
      }
    });
  });
}

function ensureDeliveryConfig(deliveryMethod: DeliveryMethod) {
  const delivery = getAvailableDeliveryMethods();

  if (deliveryMethod === DeliveryMethod.SHIPMENT && !delivery.shipmentAvailable) {
    throw new AppError(
      "No está configurado el costo de envío. Falta DEFAULT_SHIPPING_COST.",
      503
    );
  }

  if (deliveryMethod === DeliveryMethod.PICKUP && !delivery.pickupAvailable) {
    throw new AppError(
      "No está configurada la dirección de retiro. Completá STORE_PICKUP_*.",
      503
    );
  }

  return delivery;
}

function resolveOrderAddress(user: UserContext, input: {
  deliveryMethod: DeliveryMethod;
  addressId?: string;
  address?: {
    label?: string;
    recipientName?: string;
    street?: string;
    number?: string;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
  };
}) {
  const pickupAddress = getStorePickupAddress();
  const selectedAddress =
    input.deliveryMethod === DeliveryMethod.SHIPMENT && input.addressId
      ? user.addresses.find((address) => address.id === input.addressId) ?? null
      : null;

  if (input.deliveryMethod === DeliveryMethod.PICKUP) {
    if (!pickupAddress) {
      throw new AppError(
        "No está configurada la dirección de retiro. Completá STORE_PICKUP_*.",
        503
      );
    }

    return {
      selectedAddress: null,
      inlineAddress: null,
      snapshot: pickupAddress
    };
  }

  return {
    selectedAddress,
    inlineAddress: input.address ?? null,
    snapshot: selectedAddress ?? input.address ?? null
  };
}

async function buildOrderPricing(input: {
  subtotal: number;
  province?: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
}) {
  const shippingCost =
    input.deliveryMethod === DeliveryMethod.SHIPMENT ? getShippingCost() : 0;

  if (shippingCost === null) {
    throw new AppError(
      "No está configurado el costo de envío. Falta DEFAULT_SHIPPING_COST.",
      503
    );
  }

  return buildCheckoutPricing({
    subtotal: input.subtotal,
    province: input.province,
    paymentMethod: input.paymentMethod,
    shippingCost
  });
}

export async function getCheckoutQuote(
  user: UserContext,
  cart: Awaited<ReturnType<typeof getCartByUserId>>,
  input: unknown
): Promise<CheckoutQuoteDto> {
  const data = quoteCheckoutSchema.parse(input);
  const delivery = ensureDeliveryConfig(data.deliveryMethod);

  const province =
    data.deliveryMethod === DeliveryMethod.PICKUP
      ? delivery.pickupAddress?.province ?? null
      : data.province?.trim() || user.addresses[0]?.province || null;

  const availablePaymentMethods = getAvailablePaymentMethods(province);
  const fallbackPaymentMethod =
    availablePaymentMethods[0] ?? PaymentMethod.CASH;
  const paymentMethod =
    data.paymentMethod && availablePaymentMethods.includes(data.paymentMethod)
      ? data.paymentMethod
      : fallbackPaymentMethod;

  const pricing = await buildOrderPricing({
    subtotal: cart.subtotal,
    province,
    deliveryMethod: data.deliveryMethod,
    paymentMethod
  });

  const shippingCost =
    data.deliveryMethod === DeliveryMethod.SHIPMENT ? getShippingCost() ?? 0 : 0;
  const transferPricing = getBankTransferConfig()
    ? await buildCheckoutPricing({
        subtotal: cart.subtotal,
        province,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        shippingCost
      })
    : null;
  const transferConfig = getBankTransferConfig();

  return {
    deliveryMethod: data.deliveryMethod,
    province,
    subtotal: cart.subtotal,
    shippingCost: pricing.shippingCost,
    discountAmount: pricing.discountAmount,
    total: pricing.total,
    availablePaymentMethods: buildPaymentMethodOptions({
      province,
      transferDiscount: transferPricing?.appliedDiscount ?? null
    }),
    appliedDiscount: pricing.appliedDiscount,
    transferPreview: transferConfig
      ? {
          alias: transferConfig.alias,
          cbu: transferConfig.cbu,
          accountHolder: transferConfig.accountHolder,
          bankName: transferConfig.bankName,
          instructions: transferConfig.instructions
        }
      : null
  };
}

export async function releaseExpiredOrders() {
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_VERIFICATION]
      },
      reservedUntil: {
        lt: new Date()
      }
    }
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      await restockOrderItems(tx, order.id);
      await markOrderCanceled(tx, order.id);
    });
  }

  return expiredOrders.length;
}

export async function createOrderFromCart(user: UserContext, input: unknown) {
  await releaseExpiredOrders();

  const data = createOrderSchema.parse(input);
  const cart = await getCartByUserId(user.id);

  if (cart.items.length === 0) {
    throw new AppError("Tu carrito está vacío");
  }

  ensureDeliveryConfig(data.deliveryMethod);
  const { selectedAddress, inlineAddress, snapshot } = resolveOrderAddress(user, data);

  if (data.deliveryMethod === DeliveryMethod.SHIPMENT && !snapshot) {
    throw new AppError("Debes indicar una dirección para el envío");
  }

  const province = snapshot?.province ?? null;
  const availablePaymentMethods = getAvailablePaymentMethods(province);

  if (!availablePaymentMethods.includes(data.paymentMethod)) {
    throw new AppError("Ese medio de pago no está disponible para tu ubicación");
  }

  if (
    data.paymentMethod === PaymentMethod.CASH &&
    !isCordobaProvince(snapshot?.province)
  ) {
    throw new AppError("El pago en efectivo sólo está disponible en Córdoba");
  }

  const pricing = await buildOrderPricing({
    subtotal: cart.subtotal,
    province,
    deliveryMethod: data.deliveryMethod,
    paymentMethod: data.paymentMethod
  });

  const reservationMinutes = getReservationWindowMinutes(data.paymentMethod);

  if (reservationMinutes === null) {
    throw new AppError(
      "No está configurado el vencimiento de reserva. Revisá *_RESERVATION_MINUTES.",
      503
    );
  }

  const reservedUntil = new Date(Date.now() + reservationMinutes * 60 * 1000);
  const orderCode = generateOrderCode();
  const bankTransfer = getBankTransferConfig();

  if (data.paymentMethod === PaymentMethod.BANK_TRANSFER && !bankTransfer) {
    throw new AppError(
      "La transferencia bancaria no está configurada. Faltan BANK_TRANSFER_*.",
      503
    );
  }

  if (data.paymentMethod === PaymentMethod.BANK_TRANSFER && !data.transferReceipt) {
    throw new AppError(
      "Debes adjuntar el comprobante antes de confirmar una transferencia.",
      400
    );
  }

  const createdOrder = await prisma.$transaction(async (tx) => {
    const productIds = cart.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    for (const item of cart.items) {
      const product = products.find((entry) => entry.id === item.productId);

      if (!product || !product.active || product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para ${item.name}`);
      }
    }

    let addressId: string | undefined = selectedAddress?.id;

    if (
      data.deliveryMethod === DeliveryMethod.SHIPMENT &&
      !addressId &&
      inlineAddress &&
      data.saveAddress
    ) {
      const createdAddress = await tx.address.create({
        data: {
          userId: user.id,
          label: inlineAddress.label ?? "Envío",
          recipientName: inlineAddress.recipientName ?? `${user.firstName} ${user.lastName}`,
          street: inlineAddress.street ?? "",
          number: inlineAddress.number ?? "",
          floor: inlineAddress.floor,
          apartment: inlineAddress.apartment,
          city: inlineAddress.city ?? "",
          province: inlineAddress.province ?? "",
          postalCode: inlineAddress.postalCode ?? "",
          country: inlineAddress.country ?? "Argentina",
          notes: inlineAddress.notes,
          isDefault: user.addresses.length === 0
        }
      });

      addressId = createdAddress.id;
    }

    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        addressId,
        deliveryMethod: data.deliveryMethod,
        paymentMethod: data.paymentMethod,
        status:
          data.paymentMethod === PaymentMethod.BANK_TRANSFER
            ? OrderStatus.PENDING_VERIFICATION
            : OrderStatus.PENDING_PAYMENT,
        subtotal: cart.subtotal,
        discountTotal: pricing.discountAmount,
        shippingCost: pricing.shippingCost,
        total: pricing.total,
        notes: data.notes,
        paymentDueAt: reservedUntil,
        reservedUntil,
        recipientName:
          snapshot?.recipientName ?? `${user.firstName} ${user.lastName}`,
        contactPhone: user.phone,
        street: snapshot?.street,
        number: snapshot?.number,
        floor: snapshot?.floor,
        apartment: snapshot?.apartment,
        city: snapshot?.city ?? "",
        province: snapshot?.province ?? "",
        postalCode: snapshot?.postalCode,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            nameSnapshot: item.name,
            brandSnapshot: item.brand,
            price: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal
          }))
        },
        payment: {
          create: {
            provider: data.paymentMethod,
            status:
              data.paymentMethod === PaymentMethod.BANK_TRANSFER
                ? PaymentStatus.UNDER_REVIEW
                : PaymentStatus.PENDING,
            amount: pricing.total,
            externalReference: orderCode,
            aliasSnapshot:
              data.paymentMethod === PaymentMethod.BANK_TRANSFER
                ? bankTransfer?.alias ?? null
                : null,
            metadata:
              data.paymentMethod === PaymentMethod.BANK_TRANSFER
                ? {
                    transfer: {
                      ...bankTransfer,
                      receipt: data.transferReceipt ?? null
                    }
                  }
                : Prisma.JsonNull
          }
        }
      },
      include: orderInclude
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id
      }
    });

    return order;
  });

  if (data.paymentMethod === PaymentMethod.MERCADO_PAGO) {
    try {
      const preference = await createMercadoPagoPreference({
        orderId: createdOrder.id,
        orderCode: createdOrder.code,
        total: pricing.total,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        items: cart.items.map((item) => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      });

      await prisma.payment.update({
        where: {
          orderId: createdOrder.id
        },
        data: {
          metadata: {
            preferenceId: preference.preferenceId,
            checkoutUrl: preference.checkoutUrl,
            mode: preference.mode
          }
        }
      });
    } catch (error) {
      await rollbackMercadoPagoOrder({
        orderId: createdOrder.id,
        cartId: cart.id,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      });

      throw error;
    }
  }

  const finalizedOrder = await getOrderRecord(createdOrder.id);

  if (!finalizedOrder) {
    throw new AppError("No se pudo recuperar el pedido creado", 500);
  }

  const mappedOrder = mapOrder(finalizedOrder);

  void sendOrderCreatedEmail({
    email: user.email,
    firstName: user.firstName,
    order: {
      id: mappedOrder.id,
      code: mappedOrder.code,
      total: mappedOrder.total,
      status: mappedOrder.status
    }
  }).catch((error) => {
    console.error("No se pudo enviar la notificación de pedido creado", error);
  });

  revalidatePath("/mis-pedidos");
  revalidatePath("/admin/pedidos");

  return {
    order: mappedOrder,
    checkoutUrl: mappedOrder.payment.checkoutUrl
  };
}

export async function listOrdersByUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return orders.map(mapOrder);
}

export async function getOrderById(orderId: string, userId?: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(userId ? { userId } : {})
    },
    include: orderInclude
  });

  return order ? mapOrder(order) : null;
}

export async function listAllOrders() {
  const orders = await prisma.order.findMany({
    include: {
      ...orderInclude,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return orders.map((order) => ({
    ...mapOrder(order),
    customer: `${order.user.firstName} ${order.user.lastName}`,
    email: order.user.email
  }));
}

export async function confirmTransferPayment(orderId: string, adminUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      user: {
        select: {
          firstName: true,
          email: true
        }
      }
    }
  });

  if (!order || !order.payment) {
    throw new AppError("Pedido no encontrado", 404);
  }

  if (order.payment.provider !== PaymentMethod.BANK_TRANSFER) {
    throw new AppError("El pedido no corresponde a una transferencia");
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.APPROVED,
        paidAt: new Date()
      }
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID
      },
      include: orderInclude
    });
  });

  await logAdminAction({
    adminUserId,
    action: "TRANSFER_CONFIRMED",
    entity: "order",
    entityId: orderId
  });

  const mappedOrder = mapOrder(updatedOrder);

  void sendPaymentApprovedEmail({
    email: order.user.email,
    firstName: order.user.firstName,
    order: {
      id: mappedOrder.id,
      code: mappedOrder.code,
      total: mappedOrder.total,
      status: mappedOrder.status
    }
  }).catch((error) => {
    console.error("No se pudo enviar la notificación de pago aprobado", error);
  });

  revalidatePath("/mis-pedidos");
  revalidatePath("/admin/pedidos");

  return mappedOrder;
}

export async function updateOrderStatus(
  orderId: string,
  statusInput: unknown,
  adminUserId: string
) {
  const status = orderStatusSchema.parse(statusInput);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      user: {
        select: {
          firstName: true,
          email: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError("Pedido no encontrado", 404);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (status === OrderStatus.CANCELED && order.status !== OrderStatus.CANCELED) {
      await restockOrderItems(tx, orderId);
      await markOrderCanceled(tx, orderId);
    }

    if (status === OrderStatus.PAID) {
      await tx.payment.updateMany({
        where: {
          orderId
        },
        data: {
          status: PaymentStatus.APPROVED,
          paidAt: new Date()
        }
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status },
      include: orderInclude
    });
  });

  await logAdminAction({
    adminUserId,
    action: "ORDER_STATUS_UPDATED",
    entity: "order",
    entityId: orderId,
    metadata: {
      status
    }
  });

  const mappedOrder = mapOrder(updatedOrder);

  if (order.status !== mappedOrder.status) {
    const notify =
      mappedOrder.status === OrderStatus.PAID
        ? sendPaymentApprovedEmail({
            email: order.user.email,
            firstName: order.user.firstName,
            order: {
              id: mappedOrder.id,
              code: mappedOrder.code,
              total: mappedOrder.total,
              status: mappedOrder.status
            }
          })
        : sendOrderStatusChangedEmail({
            email: order.user.email,
            firstName: order.user.firstName,
            previousStatus: order.status,
            order: {
              id: mappedOrder.id,
              code: mappedOrder.code,
              total: mappedOrder.total,
              status: mappedOrder.status
            }
          });

    void notify.catch((error) => {
      console.error("No se pudo enviar la notificación de estado", error);
    });
  }

  revalidatePath("/mis-pedidos");
  revalidatePath("/admin/pedidos");

  return mappedOrder;
}

export function parseAdminOrderAction(input: unknown) {
  return orderAdminActionSchema.parse(input);
}
