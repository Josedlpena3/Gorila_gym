/**
 * Datos para los tests end to end.
 *
 * Se ejecuta contra la base de E2E (nunca la de desarrollo) y la deja siempre
 * en el mismo estado: borra lo que creó la corrida anterior y vuelve a crear
 * un catálogo chico y predecible. Los tests pueden entonces afirmar sobre
 * nombres y precios concretos en vez de sobre "lo que haya".
 */
import { Objective, RoleKey } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Los slugs siguen la regla de la aplicación —`slugify(\`${name} ${brand}\`)`,
 * ver buildProductSlug— y no un valor arbitrario. Si no coincidieran, el
 * primer guardado desde el panel los regeneraría y la URL sembrada dejaría de
 * existir a mitad de la suite.
 */
export const E2E = {
  admin: { email: "admin.e2e@test.local", password: "AdminE2e123" },
  cliente: { email: "cliente.e2e@test.local", password: "ClienteE2e123" },
  categorias: {
    proteinas: { name: "Proteínas E2E", slug: "proteinas-e2e" },
    creatinas: { name: "Creatinas E2E", slug: "creatinas-e2e" }
  },
  productos: {
    whey: {
      name: "Whey Protein E2E",
      slug: "whey-protein-e2e-marca-e2e",
      sku: "E2E-WHEY",
      price: 75000,
      stock: 12
    },
    creatina: {
      name: "Creatina Monohidrato E2E",
      slug: "creatina-monohidrato-e2e-marca-e2e",
      sku: "E2E-CREA",
      price: 30000,
      stock: 8
    },
    agotado: {
      name: "Producto Agotado E2E",
      slug: "producto-agotado-e2e-marca-e2e",
      sku: "E2E-AGOT",
      price: 5000,
      stock: 0
    },
    // Los tests del panel editan productos: si tocaran los de arriba, los
    // tests de compra —que afirman sobre precios concretos— empezarían a
    // fallar según el orden de ejecución.
    editable: {
      name: "Editable Panel E2E",
      slug: "editable-panel-e2e-marca-e2e",
      sku: "E2E-EDIT",
      price: 20000,
      stock: 15
    },
    editableDos: {
      name: "Editable Dos Panel E2E",
      slug: "editable-dos-panel-e2e-marca-e2e",
      sku: "E2E-EDI2",
      price: 40000,
      stock: 9
    }
  }
} as const;

async function limpiar() {
  // El orden respeta las FKs.
  await prisma.auditLog.deleteMany({
    where: { adminUser: { email: { endsWith: ".e2e@test.local" } } }
  });
  await prisma.orderItem.deleteMany({
    where: { product: { sku: { startsWith: "E2E-" } } }
  });
  await prisma.payment.deleteMany({
    where: { order: { recipientName: { contains: "E2E" } } }
  });
  await prisma.order.deleteMany({
    where: { recipientName: { contains: "E2E" } }
  });
  await prisma.cartItem.deleteMany({
    where: { product: { sku: { startsWith: "E2E-" } } }
  });
  await prisma.cart.deleteMany({
    where: { user: { email: { endsWith: ".e2e@test.local" } } }
  });
  await prisma.productImage.deleteMany({
    where: { product: { sku: { startsWith: "E2E-" } } }
  });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "E2E-" } } });
  await prisma.address.deleteMany({
    where: { user: { email: { endsWith: ".e2e@test.local" } } }
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: ".e2e@test.local" } }
  });
}

async function rol(key: RoleKey) {
  const existente = await prisma.role.findFirst({ where: { key } });

  if (existente) {
    return existente;
  }

  return prisma.role.create({
    data: { key, label: key === RoleKey.ADMIN ? "Administrador" : "Cliente" }
  });
}

export async function seedE2E() {
  await limpiar();

  const [rolAdmin, rolCliente] = await Promise.all([
    rol(RoleKey.ADMIN),
    rol(RoleKey.CUSTOMER)
  ]);

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "E2E",
      email: E2E.admin.email,
      emailVerified: true,
      phone: "3511110000",
      passwordHash: await bcrypt.hash(E2E.admin.password, 10),
      roleId: rolAdmin.id
    }
  });

  await prisma.user.create({
    data: {
      firstName: "Cliente",
      lastName: "E2E",
      email: E2E.cliente.email,
      emailVerified: true,
      phone: "3511110001",
      passwordHash: await bcrypt.hash(E2E.cliente.password, 10),
      roleId: rolCliente.id
    }
  });

  // Upsert y no create: si se borraran y recrearan, cada corrida les daría un
  // id nuevo, y el servidor cachea la lista de categorías una hora. El
  // formulario del panel rendearía opciones con ids viejos y guardar fallaría
  // con "La categoría seleccionada no existe".
  const proteinas = await prisma.category.upsert({
    where: { slug: E2E.categorias.proteinas.slug },
    update: { name: E2E.categorias.proteinas.name },
    create: E2E.categorias.proteinas
  });
  const creatinas = await prisma.category.upsert({
    where: { slug: E2E.categorias.creatinas.slug },
    update: { name: E2E.categorias.creatinas.name },
    create: E2E.categorias.creatinas
  });

  const comun = {
    brand: "Marca E2E",
    description:
      "Producto creado para los tests end to end, con una descripción suficientemente larga.",
    benefits: [],
    objective: Objective.PERFORMANCE,
    active: true
  };

  await prisma.product.create({
    data: {
      ...comun,
      ...E2E.productos.whey,
      categoryId: proteinas.id,
      objective: Objective.MUSCLE_GAIN
    }
  });
  await prisma.product.create({
    data: { ...comun, ...E2E.productos.creatina, categoryId: creatinas.id }
  });
  await prisma.product.create({
    data: { ...comun, ...E2E.productos.agotado, categoryId: creatinas.id }
  });
  await prisma.product.create({
    data: { ...comun, ...E2E.productos.editable, categoryId: proteinas.id }
  });
  await prisma.product.create({
    data: { ...comun, ...E2E.productos.editableDos, categoryId: proteinas.id }
  });

  const siteConfig = await prisma.siteConfig.findFirst();

  if (!siteConfig) {
    await prisma.siteConfig.create({
      data: {
        address: "Av. Siempre Viva 123, Villa Allende",
        googleMapsUrl: "https://www.google.com/maps/embed?pb=e2e",
        whatsappNumber: "5493511110000",
        whatsappMessage: "Hola, quiero hacer una consulta."
      }
    });
  }

  return { proteinasId: proteinas.id, creatinasId: creatinas.id };
}

// Permite correrlo a mano: `tsx e2e/seed.ts`
if (process.argv[1]?.endsWith("seed.ts")) {
  seedE2E()
    .then(() => console.log("seed e2e listo"))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
