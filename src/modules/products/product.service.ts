import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isStoredUploadUrl } from "@/lib/uploads";
import { decimalToNumber, slugify } from "@/lib/utils";
import {
  catalogProductQuerySchema,
  productSchema
} from "@/modules/products/product.schemas";
import type {
  CatalogProductsPageDto,
  ProductCardDto,
  ProductDetailDto
} from "@/types";

const DEFAULT_CATEGORIES = [
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

const DEFAULT_FEATURED_PRIORITY = 999;

const productInclude = {
  category: true,
  images: {
    orderBy: {
      position: "asc" as const
    }
  }
};

export type BulkCreateProductsResult = {
  created: number;
  failed: number;
  errors: Array<{
    index: number;
    sku: string | null;
    name: string | null;
    error: string;
  }>;
};

function isPublicImageUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function ensureDefaultCategories() {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
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
}

async function getSortedCategories() {
  await ensureDefaultCategories();

  return prisma.category.findMany({
    orderBy: {
      name: "asc"
    }
  });
}

function normalizeProductImages(urls: string[]) {
  const normalized = urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => {
      if (isStoredUploadUrl(url) || isPublicImageUrl(url)) {
        return url;
      }

      throw new AppError("Las imágenes del producto no son válidas.", 400);
    });

  return Array.from(new Set(normalized));
}

function buildProductSlug(input: {
  name: string;
  brand: string;
  slug?: string | null;
}) {
  return slugify(input.slug?.trim() || `${input.name} ${input.brand}`);
}

async function assertProductDoesNotExist(input: {
  sku: string;
  name: string;
  brand: string;
  excludeProductId?: string;
}) {
  const duplicateProduct = await prisma.product.findFirst({
    where: {
      ...(input.excludeProductId
        ? {
            id: {
              not: input.excludeProductId
            }
          }
        : {}),
      OR: [
        {
          sku: {
            equals: input.sku,
            mode: "insensitive"
          }
        },
        {
          AND: [
            {
              name: {
                equals: input.name,
                mode: "insensitive"
              }
            },
            {
              brand: {
                equals: input.brand,
                mode: "insensitive"
              }
            }
          ]
        }
      ]
    },
    select: {
      id: true
    }
  });

  if (duplicateProduct) {
    throw new AppError("Este producto ya existe", 409);
  }
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true
    }
  });

  if (!category) {
    throw new AppError("La categoría seleccionada no existe", 404);
  }
}

function throwIfProductPersistenceError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("Este producto ya existe", 409);
  }

  throw error;
}

function getBulkErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    const details = error.flatten();
    const firstFieldError = Object.values(details.fieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));
    const firstFormError = details.formErrors.find(Boolean);

    return firstFieldError ?? firstFormError ?? "Datos inválidos";
  }

  return "Error interno";
}

function getBulkProductDebugInfo(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      sku: null,
      name: null
    };
  }

  const product = input as Record<string, unknown>;

  return {
    sku: typeof product.sku === "string" ? product.sku : null,
    name: typeof product.name === "string" ? product.name : null
  };
}

function mapProductCard(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>): ProductCardDto {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category.name,
    price: decimalToNumber(product.price) ?? 0,
    stock: product.stock,
    image: primaryImage?.url ?? null,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt
    })),
    description: product.description,
    objective: product.objective,
    featured: product.featured,
    featuredPriority: product.featuredPriority,
    weight: product.weight,
    flavor: product.flavor
  };
}

function mapProductDetail(
  product: Prisma.ProductGetPayload<{ include: typeof productInclude }>
): ProductDetailDto {
  return {
    ...mapProductCard(product),
    description: product.description,
    benefits: product.benefits,
    weight: product.weight,
    flavor: product.flavor,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt
    }))
  };
}

export async function listCatalogProducts(filters: unknown = {}): Promise<CatalogProductsPageDto> {
  const data = catalogProductQuerySchema.parse(filters);
  const page = data.page ?? 1;
  const limit = data.limit ?? 20;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(data.q
      ? {
          OR: [
            {
              name: {
                contains: data.q,
                mode: "insensitive"
              }
            },
            {
              brand: {
                contains: data.q,
                mode: "insensitive"
              }
            },
            {
              description: {
                contains: data.q,
                mode: "insensitive"
              }
            },
            {
              category: {
                name: {
                  contains: data.q,
                  mode: "insensitive"
                }
              }
            }
          ]
        }
      : {}),
    ...(data.categoryId
      ? {
          categoryId: data.categoryId
        }
      : data.category
      ? {
          category: {
            slug: data.category
          }
        }
      : {}),
    ...(data.brand
      ? {
          brand: data.brand
        }
      : {}),
    ...(data.objective
      ? {
          objective: data.objective
        }
      : {}),
    ...(data.minPrice || data.maxPrice
      ? {
          price: {
            ...(data.minPrice ? { gte: data.minPrice } : {}),
            ...(data.maxPrice ? { lte: data.maxPrice } : {})
          }
        }
      : {})
  };

  const [total, products] = await Promise.all([
    prisma.product.count({
      where
    }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [
        { featured: "desc" },
        { featuredPriority: "asc" },
        { createdAt: "desc" },
        { id: "desc" }
      ],
      skip: (page - 1) * limit,
      take: limit
    })
  ]);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    products: products.map(mapProductCard),
    total,
    page,
    totalPages
  };
}

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      featured: true
    },
    include: productInclude,
    orderBy: [{ featuredPriority: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit
  });

  return products.map(mapProductCard);
}

export async function getHomeProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: {
      active: true
    },
    include: productInclude,
    orderBy: [
      { featured: "desc" },
      { featuredPriority: "asc" },
      { createdAt: "desc" },
      { id: "desc" }
    ],
    take: limit
  });

  return products.map(mapProductCard);
}

export async function listCategories() {
  return getSortedCategories();
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude
  });

  if (!product || !product.active) {
    return null;
  }

  return mapProductDetail(product);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude
  });

  return product ? mapProductDetail(product) : null;
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude
  });

  if (!product) {
    return null;
  }

  return {
    ...mapProductDetail(product),
    sku: product.sku,
    categoryId: product.categoryId,
    active: product.active,
    featuredPriority: product.featuredPriority
  };
}

export async function getAdminProducts() {
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return products.map((product) => ({
    ...mapProductDetail(product),
    sku: product.sku,
    categoryId: product.categoryId,
    active: product.active,
    featuredPriority: product.featuredPriority
  }));
}

export async function getStockOverview() {
  const products = await prisma.product.findMany({
    where: {
      active: true
    },
    include: {
      category: true
    },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }]
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    brand: product.brand,
    category: product.category.name,
    price: decimalToNumber(product.price) ?? 0
  }));
}

export async function createProduct(input: unknown, adminUserId: string) {
  const data = productSchema.parse(input);
  await assertProductDoesNotExist({
    sku: data.sku,
    name: data.name,
    brand: data.brand
  });
  await assertCategoryExists(data.categoryId);

  const slug = buildProductSlug(data);
  const images = normalizeProductImages(data.images);
  const featuredPriority = data.featured
    ? Math.max(data.featuredPriority ?? 1, 1)
    : DEFAULT_FEATURED_PRIORITY;
  console.log("Imagen guardada:", images[0] ?? null);

  let product;

  try {
    product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug,
        brand: data.brand,
        categoryId: data.categoryId,
        description: data.description,
        benefits: data.benefits,
        price: data.price,
        stock: data.stock,
        objective: data.objective,
        active: data.active,
        featured: data.featured,
        featuredPriority,
        weight: data.weight,
        flavor: data.flavor,
        images: {
          create: images.map((url, index) => ({
            url,
            alt: `${data.name} imagen ${index + 1}`,
            position: index,
            isPrimary: index === 0
          }))
        }
      }
    });
  } catch (error) {
    throwIfProductPersistenceError(error);
  }

  await logAdminAction({
    adminUserId,
    action: "PRODUCT_CREATED",
    entity: "product",
    entityId: product.id,
    metadata: {
      name: data.name,
      sku: data.sku
    }
  });

  return product;
}

export async function bulkCreateProducts(
  input: unknown,
  adminUserId: string
): Promise<BulkCreateProductsResult> {
  if (!Array.isArray(input)) {
    throw new AppError("Debes enviar un array de productos", 400);
  }

  let created = 0;
  let failed = 0;
  const errors: BulkCreateProductsResult["errors"] = [];

  for (const [index, item] of input.entries()) {
    const debugInfo = getBulkProductDebugInfo(item);

    try {
      await createProduct(item, adminUserId);
      created += 1;
    } catch (error) {
      failed += 1;
      const message = getBulkErrorMessage(error);

      console.warn("[bulk_products] producto omitido", {
        index,
        sku: debugInfo.sku,
        name: debugInfo.name,
        message
      });

      errors.push({
        index,
        sku: debugInfo.sku,
        name: debugInfo.name,
        error: message
      });
    }
  }

  return {
    created,
    failed,
    errors
  };
}

export async function updateProduct(
  id: string,
  input: unknown,
  adminUserId: string
) {
  const data = productSchema.parse(input);

  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true
    }
  });

  if (!existingProduct) {
    throw new AppError("Producto no encontrado", 404);
  }

  await assertProductDoesNotExist({
    sku: data.sku,
    name: data.name,
    brand: data.brand,
    excludeProductId: id
  });
  await assertCategoryExists(data.categoryId);

  const slug = buildProductSlug(data);
  const images = normalizeProductImages(data.images);
  const featuredPriority = data.featured
    ? Math.max(data.featuredPriority ?? 1, 1)
    : DEFAULT_FEATURED_PRIORITY;
  console.log("Imagen guardada:", images[0] ?? null);

  let product;

  try {
    product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({
        where: {
          productId: id
        }
      });

      return tx.product.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          slug,
          brand: data.brand,
          categoryId: data.categoryId,
          description: data.description,
          benefits: data.benefits,
          price: data.price,
          stock: data.stock,
          objective: data.objective,
          active: data.active,
          featured: data.featured,
          featuredPriority,
          weight: data.weight,
          flavor: data.flavor,
          images: {
            create: images.map((url, index) => ({
              url,
              alt: `${data.name} imagen ${index + 1}`,
              position: index,
              isPrimary: index === 0
            }))
          }
        }
      });
    });
  } catch (error) {
    throwIfProductPersistenceError(error);
  }

  await logAdminAction({
    adminUserId,
    action: "PRODUCT_UPDATED",
    entity: "product",
    entityId: product.id,
    metadata: {
      name: product.name,
      sku: product.sku
    }
  });

  return product;
}

export async function deleteProduct(id: string, adminUserId: string) {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      orderItems: {
        select: {
          id: true
        }
      }
    }
  });

  if (!existingProduct) {
    throw new AppError("Producto no encontrado", 404);
  }

  if (existingProduct.orderItems.length > 0) {
    const archived = await prisma.product.update({
      where: { id },
      data: {
        active: false,
        stock: 0
      }
    });

    await logAdminAction({
      adminUserId,
      action: "PRODUCT_ARCHIVED",
      entity: "product",
      entityId: archived.id
    });

    return archived;
  }

  await prisma.product.delete({
    where: { id }
  });

  await logAdminAction({
    adminUserId,
    action: "PRODUCT_DELETED",
    entity: "product",
    entityId: id
  });

  return { id };
}
