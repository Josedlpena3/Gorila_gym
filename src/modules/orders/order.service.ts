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
  getShippingCost,
  getStorePickupAddress
} from "@/lib/store-config";
import { decimalToNumber, generateOrderCode } from "@/lib/utils";
import { getCartByUserId } from "@/modules/cart/cart.service";
import {
  createOrderSchema,
  orderAdminActionSchema,
  orderStatusSchema,
  quoteCheckoutSchema
} from "@/modules/orders/order.schemas";
import {
  sendAdminOrderNotificationEmail,
  sendOrderCreatedEmail,
  sendOrderStatusChangedEmail
} from "@/modules/notifications/notification.service";
import {
  buildCheckoutPricing,
  buildPaymentMethodOptions,
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

async function reserveOrderItems(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId }
  });

  for (const item of items) {
    if (!item.productId) {
      continue;
    }

    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: {
        stock: true,
        active: true,
        name: true
      }
    });

    if (!product || !product.active || product.stock < item.quantity) {
      throw new AppError(
        `No hay stock suficiente para reactivar ${product?.name ?? "el pedido"}`,
        409
      );
    }

    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity
        }
      }
    });
  }
}

async function markOrderCancelled(tx: Prisma.TransactionClient, orderId: string) {
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELLED
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
        status: OrderStatus.CANCELLED
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
  return 0;
}

export async function createOrderFromCart(user: UserContext, input: unknown) {
  await releaseExpiredOrders();

  const data = createOrderSchema.parse(input);
  const cart = await getCartByUserId(user.id);

  if (cart.items.length === 0) {
    throw new AppError("Tu carrito está vacío");
  }

  const deliveryMethod = DeliveryMethod.SHIPMENT;
  const recipientName = `${data.firstName} ${data.lastName}`.trim();
  const snapshot = {
    recipientName,
    street: data.address.street,
    number: data.address.number,
    floor: null,
    apartment: null,
    city: data.address.city,
    province: data.address.province,
    postalCode: data.address.postalCode,
    country: "Argentina"
  };
  const orderCode = generateOrderCode();
  const pricing = {
    shippingCost: 0,
    discountAmount: 0,
    total: cart.subtotal
  };

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

    await tx.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      }
    });

    const existingDefaultAddress = await tx.address.findFirst({
      where: {
        userId: user.id,
        isDefault: true
      }
    });

    const savedAddress = existingDefaultAddress
      ? await tx.address.update({
          where: { id: existingDefaultAddress.id },
          data: {
            recipientName,
            street: snapshot.street,
            number: snapshot.number,
            city: snapshot.city,
            province: snapshot.province,
            postalCode: snapshot.postalCode,
            country: snapshot.country,
            isDefault: true
          }
        })
      : await tx.address.create({
          data: {
            userId: user.id,
            label: "Principal",
            recipientName,
            street: snapshot.street,
            number: snapshot.number,
            city: snapshot.city,
            province: snapshot.province,
            postalCode: snapshot.postalCode,
            country: snapshot.country,
            isDefault: true
          }
        });

    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        addressId: savedAddress.id,
        deliveryMethod,
        paymentMethod: PaymentMethod.CASH,
        status: OrderStatus.PENDING_CONFIRMATION,
        subtotal: cart.subtotal,
        discountTotal: pricing.discountAmount,
        shippingCost: pricing.shippingCost,
        total: pricing.total,
        notes: data.notes?.trim() || undefined,
        recipientName,
        contactPhone: data.phone,
        street: snapshot.street,
        number: snapshot.number,
        floor: snapshot.floor,
        apartment: snapshot.apartment,
        city: snapshot.city,
        province: snapshot.province,
        postalCode: snapshot.postalCode,
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
            provider: PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
            amount: pricing.total,
            externalReference: orderCode,
            metadata: {
              mode: "manual_contact_whatsapp"
            }
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

  const finalizedOrder = await getOrderRecord(createdOrder.id);

  if (!finalizedOrder) {
    throw new AppError("No se pudo recuperar el pedido creado", 500);
  }

  const mappedOrder = mapOrder(finalizedOrder);

  void sendOrderCreatedEmail({
    email: user.email,
    firstName: data.firstName,
    order: {
      id: mappedOrder.id,
      code: mappedOrder.code,
      total: mappedOrder.total,
      status: mappedOrder.status
    }
  }).catch((error) => {
    console.error("No se pudo enviar la notificación de pedido creado", error);
  });

  void sendAdminOrderNotificationEmail({
    order: {
      id: mappedOrder.id,
      code: mappedOrder.code,
      total: mappedOrder.total,
      status: mappedOrder.status
    },
    customer: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: user.email,
      phone: data.phone
    },
    address: {
      street: snapshot.street,
      number: snapshot.number,
      city: snapshot.city,
      province: snapshot.province,
      postalCode: snapshot.postalCode
    },
    items: cart.items.map((item) => ({
      name: item.name,
      quantity: item.quantity
    }))
  }).catch((error) => {
    console.error("No se pudo enviar la notificación interna del pedido", error);
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

export async function updateOrderStatus(
  orderId: string,
  input: {
    status?: unknown;
  },
  adminUserId: string
) {
  const status = input.status !== undefined ? orderStatusSchema.parse(input.status) : undefined;

  if (status === undefined) {
    throw new AppError("Acción inválida", 400);
  }

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

  const nextOrderStatus = status;
  const shouldRestock =
    nextOrderStatus === OrderStatus.CANCELLED &&
    order.status !== OrderStatus.CANCELLED;
  const shouldReserve =
    order.status === OrderStatus.CANCELLED &&
    nextOrderStatus !== OrderStatus.CANCELLED;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (shouldRestock) {
      await restockOrderItems(tx, orderId);
    }

    if (shouldReserve) {
      await reserveOrderItems(tx, orderId);
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: nextOrderStatus
      },
      include: orderInclude
    });
  });

  await logAdminAction({
    adminUserId,
    action: "ORDER_STATUS_UPDATED",
    entity: "order",
    entityId: orderId,
    metadata: {
      previousStatus: order.status,
      status: nextOrderStatus
    }
  });

  const mappedOrder = mapOrder(updatedOrder);

  if (order.status !== mappedOrder.status) {
    const notify = sendOrderStatusChangedEmail({
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
