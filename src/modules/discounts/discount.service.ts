import { Prisma } from "@prisma/client";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { discountSchema } from "@/modules/discounts/discount.schemas";

function mapDiscount(discount: Prisma.DiscountGetPayload<object>) {
  return {
    ...discount,
    value: decimalToNumber(discount.value) ?? 0,
    startsAt: discount.startsAt?.toISOString() ?? null,
    endsAt: discount.endsAt?.toISOString() ?? null,
    createdAt: discount.createdAt.toISOString(),
    updatedAt: discount.updatedAt.toISOString()
  };
}

export async function listDiscounts() {
  const discounts = await prisma.discount.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return discounts.map(mapDiscount);
}

export async function createDiscount(input: unknown, adminUserId: string) {
  const data = discountSchema.parse(input);

  const discount = await prisma.discount.create({
    data: {
      name: data.name,
      description: data.description,
      code: data.code,
      type: data.type,
      value: data.value,
      paymentMethod: data.paymentMethod,
      province: data.province,
      active: data.active,
      startsAt: data.startsAt,
      endsAt: data.endsAt
    }
  });

  await logAdminAction({
    adminUserId,
    action: "DISCOUNT_CREATED",
    entity: "discount",
    entityId: discount.id,
    metadata: {
      name: discount.name,
      code: discount.code
    }
  });

  return mapDiscount(discount);
}

export async function updateDiscount(
  discountId: string,
  input: unknown,
  adminUserId: string
) {
  const data = discountSchema.parse(input);
  const existing = await prisma.discount.findUnique({
    where: { id: discountId }
  });

  if (!existing) {
    throw new AppError("Promoción no encontrada", 404);
  }

  const updated = await prisma.discount.update({
    where: { id: discountId },
    data: {
      name: data.name,
      description: data.description,
      code: data.code,
      type: data.type,
      value: data.value,
      paymentMethod: data.paymentMethod,
      province: data.province,
      active: data.active,
      startsAt: data.startsAt,
      endsAt: data.endsAt
    }
  });

  await logAdminAction({
    adminUserId,
    action: "DISCOUNT_UPDATED",
    entity: "discount",
    entityId: discountId,
    metadata: {
      name: updated.name,
      code: updated.code
    }
  });

  return mapDiscount(updated);
}

export async function deleteDiscount(discountId: string, adminUserId: string) {
  const existing = await prisma.discount.findUnique({
    where: { id: discountId }
  });

  if (!existing) {
    throw new AppError("Promoción no encontrada", 404);
  }

  await prisma.discount.delete({
    where: { id: discountId }
  });

  await logAdminAction({
    adminUserId,
    action: "DISCOUNT_DELETED",
    entity: "discount",
    entityId: discountId,
    metadata: {
      name: existing.name,
      code: existing.code
    }
  });
}
