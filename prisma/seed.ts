import bcrypt from "bcrypt";
import {
  Objective,
  PrismaClient,
  RoleKey
} from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@gorilastrong.com";
const adminPassword = "Admin123!";
const siteConfigSeed = {
  address: "Rio de Janeiro 1725, Villa Allende, Córdoba",
  googleMapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3409.1325460175212!2d-64.2776806!3d-31.300081499999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94329cf75ca7fb19%3A0x942d968762389d9a!2sVilla%20Allende%20Shopping%20-%20VAS!5e0!3m2!1ses!2sar!4v1776644156188!5m2!1ses!2sar",
  whatsappNumber: "5493513552255",
  whatsappMessage: "Hola, quiero consultar por productos"
} as const;

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
  },
  {
    slug: "barritas",
    name: "Barritas",
    description: "Snacks proteicos y barras funcionales para el día a día."
  },
  {
    slug: "aminoacidos",
    name: "Aminoácidos",
    description: "Aminoácidos esenciales y BCAA para recuperación y rendimiento."
  },
  {
    slug: "panqueques",
    name: "Panqueques",
    description: "Mezclas proteicas para desayunos y meriendas funcionales."
  },
  {
    slug: "shakers",
    name: "Shakers",
    description: "Shakers y accesorios para preparar suplementos."
  },
  {
    slug: "geles",
    name: "Geles",
    description: "Geles energéticos para entrenamientos y competencias."
  },
  {
    slug: "otros",
    name: "Otros",
    description: "Productos complementarios y categorías especiales."
  }
] as const;

const seedProducts = [
  {
    slug: "whey-premium-gorila",
    sku: "GOR-WHEY-001",
    name: "Whey Premium",
    brand: "Gorilla Strong",
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
    featuredPriority: 1,
    weight: "2 lb",
    flavor: "Chocolate",
    image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "creatina-micronizada-gorila",
    sku: "GOR-CREA-002",
    name: "Creatina Micronizada",
    brand: "Gorilla Strong",
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
    featuredPriority: 2,
    weight: "300 g",
    flavor: "Sin sabor",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "pre-entreno-fury-gorila",
    sku: "GOR-PRE-003",
    name: "Pre Entreno Fury",
    brand: "Gorilla Strong",
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
    featuredPriority: 3,
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
      lastName: "Gorilla",
      phone: "+54 9 351 555 0000",
      passwordHash,
      roleId: adminRoleId,
      emailVerified: true,
      emailVerifiedAt: new Date()
    },
    create: {
      firstName: "Admin",
      lastName: "Gorilla",
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

async function ensureSiteConfig() {
  const existingSiteConfig = await prisma.siteConfig.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existingSiteConfig) {
    return prisma.siteConfig.update({
      where: { id: existingSiteConfig.id },
      data: siteConfigSeed
    });
  }

  return prisma.siteConfig.create({
    data: siteConfigSeed
  });
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
      featuredPriority: input.featuredPriority,
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
      featuredPriority: input.featuredPriority,
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
  await ensureSiteConfig();

  for (const product of seedProducts) {
    const category = categoryMap[product.categorySlug];

    if (!category) {
      throw new Error(`No se encontró la categoría ${product.categorySlug}`);
    }

    await ensureProduct(product, category.id);
  }

  console.info("Seed completado: admin, productos demo y configuración del sitio listos.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
