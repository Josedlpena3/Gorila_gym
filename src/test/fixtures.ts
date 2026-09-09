import { Objective, RoleKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let counter = 0;
function unique(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createTestCategory() {
  return prisma.category.create({
    data: {
      name: unique("Categoria"),
      slug: unique("categoria")
    }
  });
}

export async function createTestProduct(overrides: {
  categoryId: string;
  price?: number;
  stock?: number;
  active?: boolean;
}) {
  const slug = unique("producto");

  return prisma.product.create({
    data: {
      sku: unique("SKU").toUpperCase(),
      name: `Producto de test ${slug}`,
      slug,
      brand: "Marca Test",
      objective: Objective.PERFORMANCE,
      categoryId: overrides.categoryId,
      description: "Descripción de producto de prueba con más de veinte caracteres.",
      benefits: [],
      price: overrides.price ?? 1000,
      stock: overrides.stock ?? 10,
      active: overrides.active ?? true
    }
  });
}

export async function createTestRole(roleKey: RoleKey = RoleKey.CUSTOMER) {
  const existing = await prisma.role.findFirst({ where: { key: roleKey } });
  if (existing) return existing;

  return prisma.role.create({
    data: {
      key: roleKey,
      label: roleKey === RoleKey.ADMIN ? "Administrador" : "Cliente"
    }
  });
}

export async function createTestUser(overrides?: { phone?: string }) {
  const role = await createTestRole(RoleKey.CUSTOMER);
  const email = `${unique("user")}@test.local`;

  const user = await prisma.user.create({
    data: {
      firstName: "Test",
      lastName: "Usuario",
      email,
      emailVerified: true,
      phone: overrides?.phone ?? "3511234567",
      passwordHash: "not-a-real-hash",
      roleId: role.id
    }
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    addresses: [] as Array<{
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
    }>
  };
}

/** Limpia solo lo que crean estos fixtures, en el orden correcto de FKs. */
export async function cleanupTestData() {
  await prisma.orderItem.deleteMany({
    where: { order: { recipientName: { contains: "Test" } } }
  });
  await prisma.payment.deleteMany({
    where: { order: { recipientName: { contains: "Test" } } }
  });
  await prisma.order.deleteMany({ where: { recipientName: { contains: "Test" } } });
  await prisma.cartItem.deleteMany({
    where: { product: { name: { contains: "test", mode: "insensitive" } } }
  });
  await prisma.cart.deleteMany({ where: { user: { email: { endsWith: "@test.local" } } } });
  await prisma.address.deleteMany({ where: { user: { email: { endsWith: "@test.local" } } } });
  await prisma.product.deleteMany({ where: { name: { contains: "test", mode: "insensitive" } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: "Categoria-" } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
}
