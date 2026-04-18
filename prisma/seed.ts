import bcrypt from "bcrypt";
import {
  Objective,
  PrismaClient,
  RoleKey
} from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@gorilastrong.com";
const adminPassword = "Admin123!";

const categories = [
  {
    slug: "proteinas",
    name: "Proteínas",
    description: "Proteínas para recuperación y desarrollo muscular."
  },
  {
    slug: "creatinas",
    name: "Creatinas",
    description: "Creatinas para fuerza, potencia y rendimiento."
  },
  {
    slug: "pre-entrenos",
    name: "Pre entrenos",
    description: "Fórmulas para energía y enfoque antes de entrenar."
  }
] as const;

const seedProducts = [
  {
    slug: "whey-premium-gorila",
    sku: "GOR-WHEY-001",
    name: "Whey Premium",
    brand: "Gorila Strong",
    objective: Objective.MUSCLE_GAIN,
    categorySlug: "proteinas",
    description:
      "Proteína whey de rápida absorción para recuperación muscular y cobertura proteica diaria.",
    benefits: [
      "24 g de proteína por porción",
      "Textura cremosa",
      "Ideal para post entreno"
    ],
    price: 58990,
    stock: 18,
    featured: true,
    weight: "2 lb",
    flavor: "Chocolate",
    image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "creatina-micronizada-gorila",
    sku: "GOR-CREA-002",
    name: "Creatina Micronizada",
    brand: "Gorila Strong",
    objective: Objective.PERFORMANCE,
    categorySlug: "creatinas",
    description:
      "Creatina micronizada para mejorar fuerza, potencia y recuperación en sesiones intensas.",
    benefits: [
      "Alta pureza",
      "Mezcla rápida",
      "Sin sabor"
    ],
    price: 27990,
    stock: 24,
    featured: true,
    weight: "300 g",
    flavor: "Sin sabor",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "pre-entreno-fury-gorila",
    sku: "GOR-PRE-003",
    name: "Pre Entreno Fury",
    brand: "Gorila Strong",
    objective: Objective.PERFORMANCE,
    categorySlug: "pre-entrenos",
    description:
      "Pre entreno con cafeína y citrulina para potenciar energía, foco y congestión antes de la rutina.",
    benefits: [
      "Más energía",
      "Mejor enfoque",
      "Ideal para entrenamientos exigentes"
    ],
    price: 34990,
    stock: 14,
    featured: true,
    weight: "420 g",
    flavor: "Frutos rojos",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80"
  }
] as const;

async function ensureRoles() {
  const [customerRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { key: RoleKey.CUSTOMER },
      update: { label: "Cliente" },
      create: {
        key: RoleKey.CUSTOMER,
        label: "Cliente"
      }
    }),
    prisma.role.upsert({
      where: { key: RoleKey.ADMIN },
      update: { label: "Administrador" },
      create: {
        key: RoleKey.ADMIN,
        label: "Administrador"
      }
    })
  ]);

  return {
    customerRole,
    adminRole
  };
}

async function ensureAdminUser(adminRoleId: string) {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Admin",
      lastName: "Gorila",
      phone: "+54 9 351 555 0000",
      passwordHash,
      roleId: adminRoleId,
      emailVerified: true,
      emailVerifiedAt: new Date()
    },
    create: {
      firstName: "Admin",
      lastName: "Gorila",
      email: adminEmail,
      phone: "+54 9 351 555 0000",
      passwordHash,
      roleId: adminRoleId,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      cart: {
        create: {}
      }
    }
  });

  const cart = await prisma.cart.findUnique({
    where: { userId: admin.id }
  });

  if (!cart) {
    await prisma.cart.create({
      data: {
        userId: admin.id
      }
    });
  }

  return admin;
}

async function ensureCategories() {
  const result = await Promise.all(
    categories.map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description
        },
        create: {
          slug: category.slug,
          name: category.name,
          description: category.description
        }
      })
    )
  );

  return Object.fromEntries(result.map((category) => [category.slug, category]));
}

async function ensureProduct(input: (typeof seedProducts)[number], categoryId: string) {
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      sku: input.sku,
      name: input.name,
      brand: input.brand,
      objective: input.objective,
      categoryId,
      description: input.description,
      benefits: [...input.benefits],
      price: input.price,
      stock: input.stock,
      active: true,
      featured: input.featured,
      weight: input.weight,
      flavor: input.flavor
    },
    create: {
      sku: input.sku,
      slug: input.slug,
      name: input.name,
      brand: input.brand,
      objective: input.objective,
      categoryId,
      description: input.description,
      benefits: [...input.benefits],
      price: input.price,
      stock: input.stock,
      active: true,
      featured: input.featured,
      weight: input.weight,
      flavor: input.flavor
    }
  });

  await prisma.productImage.deleteMany({
    where: { productId: product.id }
  });

  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: input.image,
      alt: input.name,
      position: 0,
      isPrimary: true
    }
  });

  return product;
}

async function main() {
  const { adminRole } = await ensureRoles();
  await ensureAdminUser(adminRole.id);
  const categoryMap = await ensureCategories();

  for (const product of seedProducts) {
    const category = categoryMap[product.categorySlug];

    if (!category) {
      throw new Error(`No se encontró la categoría ${product.categorySlug}`);
    }

    await ensureProduct(product, category.id);
  }

  console.info("Seed completado: admin y productos demo listos.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
