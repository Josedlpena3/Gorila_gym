import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  applyCheckoutDiscount,
  buildEmptyCheckoutDiscountResult
} from "@/lib/checkout-discounts";
import { applyPaymentSurcharge } from "@/lib/checkout-pricing";
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
  createGuestOrderSchema,
  orderAdminActionSchema,
  orderDiscountUpdateSchema,
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
import type {
  AdminOrderSummaryDto,
  CheckoutQuoteDto,
  OrderSummaryDto
} from "@/types";

type AdminOrderUpdateResult = OrderSummaryDto & {
  colored: boolean;
  color: string | null;
  sellerName: string | null;
};

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
  emailVerified: boolean;
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

type GuestOrderItemInput = {
  productId: string;
  quantity: number;
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

type DiscountMetadata = {
  code?: string | null;
  applied?: string | null;
};

type PaymentMetadata = {
  preferenceId?: string | null;
  checkoutUrl?: string | null;
  mode?: string | null;
  transfer?: TransferMetadata | null;
  discount?: DiscountMetadata | null;
};

function parseJsonRecord(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

function parsePaymentMetadata(metadata: Prisma.JsonValue | null): PaymentMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const record = parseJsonRecord(metadata);
  const transferValue = record.transfer;
  const transfer =
    transferValue &&
    typeof transferValue === "object" &&
    !Array.isArray(transferValue)
      ? (transferValue as TransferMetadata)
      : null;
  const discountValue = record.discount;
  const discount =
    discountValue &&
    typeof discountValue === "object" &&
    !Array.isArray(discountValue)
      ? (discountValue as DiscountMetadata)
      : null;

  return {
    preferenceId:
      typeof record.preferenceId === "string" ? record.preferenceId : null,
    checkoutUrl: typeof record.checkoutUrl === "string" ? record.checkoutUrl : null,
    mode: typeof record.mode === "string" ? record.mode : null,
    transfer,
    discount
  };
}

function mapOrder(order: OrderRecord): OrderSummaryDto {
  const paymentMetadata = parsePaymentMetadata(order.payment?.metadata ?? null);
  const deliveryDetail =
    order.deliveryMethod === DeliveryMethod.PICKUP
      ? "Retiro en sucursal"
      : [order.street, order.number, order.city, order.province]
          .filter((value): value is string => Boolean(value && value.trim().length > 0))
          .join(", ") || null;

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,
    deliveryDetail,
    subtotal: decimalToNumber(order.subtotal) ?? 0,
    shippingCost: decimalToNumber(order.shippingCost) ?? 0,
    discountTotal: decimalToNumber(order.discountTotal) ?? 0,
    discountCode: paymentMetadata.discount?.code?.trim() || null,
    discountApplied: paymentMetadata.discount?.applied?.trim() || null,
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
    postalCode: order.postalCode?.trim() || null,
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

function mapAdminOrderVisualFields(order: {
  colored: boolean;
  color: string | null;
  sellerName: string | null;
}) {
  return {
    colored: order.colored,
    color: order.color?.trim() || null,
    sellerName: order.sellerName?.trim() || null
  };
}

async function getOrderRecord(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude
  });
}

function assertPositiveTotal(total: number) {
  if (total <= 0) {
    throw new AppError("Total inválido", 400);
  }
}

function hasDiscountCode(discountCode: string | null | undefined) {
  return Boolean(discountCode && discountCode.trim() !== "");
}

function resolveCheckoutDiscount(input: {
  discountCode: string | null | undefined;
  total: number;
  deliveryMethod: DeliveryMethod;
}) {
  console.log("discountCode recibido:", input.discountCode);

  const discountCode = input.discountCode?.trim() ?? null;

  if (!hasDiscountCode(discountCode)) {
    return buildEmptyCheckoutDiscountResult(input.total);
  }

  return applyCheckoutDiscount(discountCode, input.total, input.deliveryMethod);
}

function splitOrderRecipientName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  const [firstName = normalized, ...rest] = normalized.split(" ");

  return {
    firstName,
    lastName: rest.join(" ")
  };
}

function buildPaymentMetadataWithDiscount(
  metadata: Prisma.JsonValue | null,
  input: {
    discountCode: string | null;
    discountApplied: string | null;
  }
) {
  const nextMetadata = {
    ...parseJsonRecord(metadata)
  };

  if (!input.discountCode && !input.discountApplied) {
    delete nextMetadata.discount;
  } else {
    nextMetadata.discount = {
      code: input.discountCode,
      applied: input.discountApplied
    };
  }

  return nextMetadata as Prisma.InputJsonValue;
}

function recalculateOrderTotals(input: {
  subtotal: number;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  discountCode: string | null | undefined;
}) {
  const baseTotal = input.subtotal + input.shippingCost;
  const discount = resolveCheckoutDiscount({
    discountCode: input.discountCode,
    total: baseTotal,
    deliveryMethod: input.deliveryMethod
  });

  if (discount.invalid) {
    throw new AppError("Código de descuento inválido", 400);
  }

  return {
    discountCode: discount.discountCode,
    discountApplied: discount.discountApplied,
    discountAmount: discount.discountAmount,
    total: applyPaymentSurcharge(discount.total, input.paymentMethod)
  };
}

function buildManualPaymentData(input: {
  paymentMethod: PaymentMethod;
  total: number;
  orderCode: string;
  discountCode?: string | null;
  discountApplied?: string | null;
}) {
  if (input.paymentMethod === PaymentMethod.CARD) {
    return {
      provider: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
      amount: input.total,
      externalReference: input.orderCode,
      metadata: {
        mode: "manual_card_whatsapp",
        ...(input.discountCode || input.discountApplied
          ? {
              discount: {
                code: input.discountCode ?? null,
                applied: input.discountApplied ?? null
              }
            }
          : {})
      }
    } satisfies Prisma.PaymentCreateWithoutOrderInput;
  }

  if (input.paymentMethod === PaymentMethod.BANK_TRANSFER) {
    const transferConfig = getBankTransferConfig();

    if (!transferConfig) {
      throw new AppError(
        "La transferencia no está disponible en este momento.",
        503
      );
    }

    return {
      provider: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      amount: input.total,
      externalReference: input.orderCode,
      metadata: {
        mode: "manual_transfer_whatsapp",
        ...(input.discountCode || input.discountApplied
          ? {
              discount: {
                code: input.discountCode ?? null,
                applied: input.discountApplied ?? null
              }
            }
          : {}),
        transfer: {
          alias: transferConfig.alias,
          cbu: transferConfig.cbu,
          accountHolder: transferConfig.accountHolder,
          bankName: transferConfig.bankName,
          instructions: transferConfig.instructions
        }
      }
    } satisfies Prisma.PaymentCreateWithoutOrderInput;
  }

  return {
    provider: PaymentMethod.CASH,
    status: PaymentStatus.PENDING,
    amount: input.total,
    externalReference: input.orderCode,
    metadata: {
      mode: "manual_contact_whatsapp",
      ...(input.discountCode || input.discountApplied
        ? {
            discount: {
              code: input.discountCode ?? null,
              applied: input.discountApplied ?? null
            }
          }
        : {})
    }
  } satisfies Prisma.PaymentCreateWithoutOrderInput;
}

function resolveCheckoutSnapshot(input: {
  deliveryMethod: DeliveryMethod;
  recipientName: string;
  address?: {
    street: string;
    number: string;
    city: string;
    province: string;
    postalCode: string;
  };
}) {
  if (input.deliveryMethod === DeliveryMethod.PICKUP) {
    const pickupAddress = getStorePickupAddress();

    if (!pickupAddress) {
      throw new AppError(
        "No está configurada la dirección de retiro. Completá STORE_PICKUP_*.",
        503
      );
    }

    return {
      recipientName: input.recipientName,
      street: pickupAddress.street,
      number: pickupAddress.number,
      floor: pickupAddress.floor,
      apartment: pickupAddress.apartment,
      city: pickupAddress.city,
      province: pickupAddress.province,
      postalCode: pickupAddress.postalCode,
      country: pickupAddress.country
    };
  }

  if (!input.address) {
    throw new AppError("La dirección es obligatoria para envío", 400);
  }

  return {
    recipientName: input.recipientName,
    street: input.address.street,
    number: input.address.number,
    floor: null,
    apartment: null,
    city: input.address.city,
    province: input.address.province,
    postalCode: input.address.postalCode,
    country: "Argentina"
  };
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

  const availablePaymentMethods = getAvailablePaymentMethods({
    province,
    deliveryMethod: data.deliveryMethod
  });
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
      deliveryMethod: data.deliveryMethod,
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

  const deliveryMethod = data.deliveryMethod;
  const paymentMethod = data.paymentMethod;
  const recipientName = data.name;
  const recipientContact = splitOrderRecipientName(recipientName);
  console.log("Nombre recibido:", data.name);
  const snapshot = resolveCheckoutSnapshot({
    deliveryMethod,
    recipientName,
    address: data.address
  });
  const orderCode = generateOrderCode();
  const discount = resolveCheckoutDiscount({
    discountCode: data.discountCode,
    total: cart.subtotal,
    deliveryMethod
  });
  const pricing = {
    shippingCost: 0,
    discountAmount: discount.discountAmount,
    total: applyPaymentSurcharge(discount.total, paymentMethod)
  };

  assertPositiveTotal(pricing.total);

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
        phone: data.phone
      }
    });

    const existingDefaultAddress = await tx.address.findFirst({
      where: {
        userId: user.id,
        isDefault: true
      }
    });

    const savedAddress =
      deliveryMethod === DeliveryMethod.SHIPMENT
        ? existingDefaultAddress
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
            })
        : null;

    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        addressId: savedAddress?.id,
        deliveryMethod,
        paymentMethod,
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
          create: buildManualPaymentData({
            paymentMethod,
            total: pricing.total,
            orderCode,
            discountCode: discount.discountCode,
            discountApplied: discount.discountApplied
          })
        }
      },
      include: orderInclude
    });
    console.log("Nombre guardado:", order.recipientName);

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
    firstName: recipientContact.firstName,
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
      firstName: recipientContact.firstName,
      lastName: recipientContact.lastName,
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

export async function createGuestOrder(input: unknown) {
  await releaseExpiredOrders();

  const data = createGuestOrderSchema.parse(input);
  const deliveryMethod = data.deliveryMethod;
  const paymentMethod = data.paymentMethod;
  const recipientName = data.name;
  const recipientContact = splitOrderRecipientName(recipientName);
  console.log("Nombre recibido:", data.name);
  const snapshot = resolveCheckoutSnapshot({
    deliveryMethod,
    recipientName,
    address: data.address
  });
  const orderCode = generateOrderCode();

  const createdOrder = await prisma.$transaction(async (tx) => {
    const groupedItems = data.items.reduce<Map<string, number>>((acc, item) => {
      acc.set(item.productId, (acc.get(item.productId) ?? 0) + item.quantity);
      return acc;
    }, new Map());
    const productIds = [...groupedItems.keys()];
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    if (products.length !== productIds.length) {
      throw new AppError("Hay productos del carrito que ya no están disponibles", 409);
    }

    const resolvedItems = productIds.map((productId) => {
      const product = products.find((entry) => entry.id === productId);
      const quantity = groupedItems.get(productId) ?? 0;

      if (!product || !product.active || quantity <= 0) {
        throw new AppError("Hay productos del carrito que ya no están disponibles", 409);
      }

      if (product.stock < quantity) {
        throw new AppError(`Stock insuficiente para ${product.name}`, 409);
      }

      const unitPrice = decimalToNumber(product.price) ?? 0;

      return {
        productId,
        quantity,
        name: product.name,
        brand: product.brand,
        unitPrice,
        subtotal: unitPrice * quantity
      };
    });

    if (resolvedItems.length === 0) {
      throw new AppError("Tu carrito está vacío", 400);
    }

    const subtotal = resolvedItems.reduce((total, item) => total + item.subtotal, 0);
    const discount = resolveCheckoutDiscount({
      discountCode: data.discountCode,
      total: subtotal,
      deliveryMethod
    });
    const pricing = {
      shippingCost: 0,
      discountAmount: discount.discountAmount,
      total: applyPaymentSurcharge(discount.total, paymentMethod)
    };

    assertPositiveTotal(pricing.total);

    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: null,
        addressId: null,
        deliveryMethod,
        paymentMethod,
        status: OrderStatus.PENDING_CONFIRMATION,
        subtotal,
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
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            nameSnapshot: item.name,
            brandSnapshot: item.brand,
            price: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal
          }))
        },
        payment: {
          create: buildManualPaymentData({
            paymentMethod,
            total: pricing.total,
            orderCode,
            discountCode: discount.discountCode,
            discountApplied: discount.discountApplied
          })
        }
      },
      include: orderInclude
    });
    console.log("Nombre guardado:", order.recipientName);

    for (const item of resolvedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return order;
  });

  const finalizedOrder = await getOrderRecord(createdOrder.id);

  if (!finalizedOrder) {
    throw new AppError("No se pudo recuperar el pedido creado", 500);
  }

  const mappedOrder = mapOrder(finalizedOrder);

  console.log("[ORDER][GUEST]", {
    id: mappedOrder.id,
    phone: mappedOrder.contactPhone,
    total: mappedOrder.total
  });

  void sendAdminOrderNotificationEmail({
    order: {
      id: mappedOrder.id,
      code: mappedOrder.code,
      total: mappedOrder.total,
      status: mappedOrder.status
    },
    customer: {
      firstName: recipientContact.firstName,
      lastName: recipientContact.lastName,
      email: "Compra sin login",
      phone: data.phone
    },
    address: {
      street: snapshot.street,
      number: snapshot.number,
      city: snapshot.city,
      province: snapshot.province,
      postalCode: snapshot.postalCode
    },
    items: finalizedOrder.items.map((item) => ({
      name: item.nameSnapshot,
      quantity: item.quantity
    }))
  }).catch((error) => {
    console.error("No se pudo enviar la notificación interna del pedido", error);
  });

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

export async function listAllOrders(): Promise<AdminOrderSummaryDto[]> {
  const orders = await prisma.order.findMany({
    include: {
      ...orderInclude,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return orders.map((order) => ({
    ...mapOrder(order),
    ...mapAdminOrderVisualFields(order),
    customer: order.recipientName,
    email: order.user?.email ?? "Compra sin login",
    customerPhone: order.contactPhone
  }));
}

export async function updateAdminOrder(
  orderId: string,
  input: {
    status?: unknown;
    colored?: boolean;
    color?: string | null;
    sellerName?: string | null;
  },
  adminUserId: string
) : Promise<AdminOrderUpdateResult> {
  const status = input.status !== undefined ? orderStatusSchema.parse(input.status) : undefined;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      ...orderInclude,
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

  const nextOrderStatus = status ?? order.status;
  const nextColored = input.colored ?? order.colored;
  const nextColor = nextColored ? input.color ?? order.color : null;
  const nextSellerName = nextColored
    ? (input.sellerName ?? order.sellerName)?.trim() || null
    : null;

  if (nextColored && !nextColor) {
    throw new AppError("Debes seleccionar un color para marcar el pedido.", 400);
  }

  const shouldRestock =
    nextOrderStatus === OrderStatus.CANCELLED &&
    order.status !== OrderStatus.CANCELLED;
  const shouldReserve =
    order.status === OrderStatus.CANCELLED &&
    nextOrderStatus !== OrderStatus.CANCELLED;
  const didStatusChange = nextOrderStatus !== order.status;
  const didVisualChange =
    nextColored !== order.colored ||
    nextColor !== order.color ||
    nextSellerName !== order.sellerName;

  if (!didStatusChange && !didVisualChange) {
    return {
      ...mapOrder(order),
      ...mapAdminOrderVisualFields(order)
    };
  }

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
        status: nextOrderStatus,
        colored: nextColored,
        color: nextColor,
        sellerName: nextSellerName
      },
      include: orderInclude
    });
  });

  if (didStatusChange) {
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
  }

  if (didVisualChange) {
    await logAdminAction({
      adminUserId,
      action: "ORDER_VISUAL_UPDATED",
      entity: "order",
      entityId: orderId,
      metadata: {
        previousColored: order.colored,
        previousColor: order.color,
        previousSellerName: order.sellerName,
        colored: nextColored,
        color: nextColor,
        sellerName: nextSellerName
      }
    });
  }

  const mappedOrder = mapOrder(updatedOrder);

  if (didStatusChange && order.user) {
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

  if (didStatusChange) {
    revalidatePath("/mis-pedidos");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");

  return {
    ...mappedOrder,
    ...mapAdminOrderVisualFields(updatedOrder)
  };
}

export async function deleteCancelledOrder(orderId: string, adminUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      code: true,
      status: true,
      userId: true
    }
  });

  if (!order) {
    throw new AppError("Pedido no encontrado", 404);
  }

  if (order.status !== OrderStatus.CANCELLED) {
    throw new AppError("Solo se pueden eliminar pedidos cancelados", 400);
  }

  await prisma.order.delete({
    where: { id: orderId }
  });

  await logAdminAction({
    adminUserId,
    action: "ORDER_DELETED",
    entity: "order",
    entityId: orderId,
    metadata: {
      code: order.code,
      status: order.status,
      userId: order.userId
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/usuarios");
  revalidatePath("/mis-pedidos");
}

export async function updateOrderDiscount(
  orderId: string,
  input: {
    discountCode?: string | null;
  },
  adminUserId: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true
    }
  });

  if (!order) {
    throw new AppError("Pedido no encontrado", 404);
  }

  if (!order.payment) {
    throw new AppError("El pedido no tiene información de pago", 400);
  }

  const nextDiscountCode = input.discountCode?.trim() || null;
  const currentMetadata = parsePaymentMetadata(order.payment.metadata ?? null);
  const pricing = recalculateOrderTotals({
    subtotal: decimalToNumber(order.subtotal) ?? 0,
    shippingCost: decimalToNumber(order.shippingCost) ?? 0,
    paymentMethod: order.paymentMethod,
    deliveryMethod: order.deliveryMethod,
    discountCode: nextDiscountCode
  });
  assertPositiveTotal(pricing.total);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        amount: pricing.total,
        metadata: buildPaymentMetadataWithDiscount(order.payment?.metadata ?? null, {
          discountCode: pricing.discountCode,
          discountApplied: pricing.discountApplied
        })
      }
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        discountTotal: pricing.discountAmount,
        total: pricing.total
      },
      include: orderInclude
    });
  });

  await logAdminAction({
    adminUserId,
    action: "ORDER_DISCOUNT_UPDATED",
    entity: "order",
    entityId: orderId,
    metadata: {
      previousDiscountCode: currentMetadata.discount?.code?.trim() || null,
      previousDiscountApplied: currentMetadata.discount?.applied?.trim() || null,
      previousDiscountTotal: decimalToNumber(order.discountTotal) ?? 0,
      previousTotal: decimalToNumber(order.total) ?? 0,
      discountCode: pricing.discountCode,
      discountApplied: pricing.discountApplied,
      discountTotal: pricing.discountAmount,
      total: pricing.total
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/mis-pedidos");

  return mapOrder(updatedOrder);
}

export function parseAdminOrderAction(input: unknown) {
  return orderAdminActionSchema.parse(input);
}

export function parseAdminOrderDiscountUpdate(input: unknown) {
  return orderDiscountUpdateSchema.parse(input);
}
