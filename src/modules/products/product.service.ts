import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isStoredUploadUrl } from "@/lib/uploads";
import { decimalToNumber, normalizeText, slugify } from "@/lib/utils";
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
    name: "Alimentos",
    description: "Alimentos funcionales como pancakes, muffins, gelatinas y mixes."
  },
  {
    slug: "shakers",
    name: "Shakers",
    description: "Shakers y accesorios para preparar suplementos."
  },
  {
    slug: "geles",
    name: "Hidratación",
    description: "Geles, isotónicas y electrolitos para entrenamientos y competencias."
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

const catalogOrderBy = [
  { featured: "desc" as const },
  { featuredPriority: "asc" as const },
  { createdAt: "desc" as const },
  { id: "desc" as const }
] satisfies Prisma.ProductOrderByWithRelationInput[];

const catalogSearchSelect = {
  id: true,
  stock: true,
  name: true,
  brand: true,
  description: true,
  category: {
    select: {
      name: true
    }
  }
} satisfies Prisma.ProductSelect;

const SEARCH_WORD_SEPARATOR = /[^a-z0-9]+/;

function generateSku() {
  return `GS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

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

type CatalogSearchCandidate = Prisma.ProductGetPayload<{
  select: typeof catalogSearchSelect;
}>;

type CatalogSearchField = {
  text: string;
  words: string[];
  weight: number;
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

const getSortedCategoriesCached = unstable_cache(
  async () => {
    const count = await prisma.category.count();
    if (count === 0) {
      await ensureDefaultCategories();
    }
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  ["sorted-categories"],
  { revalidate: 3600 }
);

async function getSortedCategories() {
  return getSortedCategoriesCached();
}

function splitNormalizedWords(text: string) {
  return text.split(SEARCH_WORD_SEPARATOR).filter(Boolean);
}

function buildCatalogSearchField(text: string, weight: number): CatalogSearchField {
  const normalized = normalizeText(text);

  return {
    text: normalized,
    words: splitNormalizedWords(normalized),
    weight
  };
}

function getAllowedFuzzyDistance(token: string) {
  if (token.length >= 8) {
    return 2;
  }

  if (token.length >= 5) {
    return 1;
  }

  return 0;
}

function getLevenshteinDistance(left: string, right: string, maxDistance: number) {
  if (left === right) {
    return 0;
  }

  if (Math.abs(left.length - right.length) > maxDistance) {
    return maxDistance + 1;
  }

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];
    let smallestValue = currentRow[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const value = Math.min(
        previousRow[rightIndex] + 1,
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex - 1] + substitutionCost
      );

      currentRow.push(value);

      if (value < smallestValue) {
        smallestValue = value;
      }
    }

    if (smallestValue > maxDistance) {
      return maxDistance + 1;
    }

    for (let index = 0; index < currentRow.length; index += 1) {
      previousRow[index] = currentRow[index];
    }
  }

  return previousRow[right.length];
}

function getCatalogFieldTokenScore(field: CatalogSearchField, token: string) {
  if (!field.text) {
    return null;
  }

  if (field.text.includes(token)) {
    if (field.words.some((word) => word === token)) {
      return field.weight;
    }

    if (field.words.some((word) => word.startsWith(token))) {
      return field.weight + 1;
    }

    return field.weight + 2;
  }

  const maxDistance = getAllowedFuzzyDistance(token);

  if (maxDistance === 0) {
    return null;
  }

  let bestScore: number | null = null;

  field.words.forEach((word) => {
    if (Math.abs(word.length - token.length) > maxDistance) {
      return;
    }

    const distance = getLevenshteinDistance(word, token, maxDistance);

    if (distance > maxDistance) {
      return;
    }

    const score = field.weight + 3 + distance;

    if (bestScore === null || score < bestScore) {
      bestScore = score;
    }
  });

  return bestScore;
}

function getCatalogProductSearchScore(product: CatalogSearchCandidate, search: string) {
  const normalizedSearch = normalizeText(search);

  if (!normalizedSearch) {
    return 0;
  }

  const tokens = splitNormalizedWords(normalizedSearch);

  if (tokens.length === 0) {
    return 0;
  }

  const fields = [
    buildCatalogSearchField(product.name, 0),
    buildCatalogSearchField(product.brand, 2),
    buildCatalogSearchField(product.category.name, 3),
    buildCatalogSearchField(product.description, 4)
  ];

  const exactScore = fields.reduce<number | null>((bestScore, field) => {
    if (!field.text.includes(normalizedSearch)) {
      return bestScore;
    }

    return bestScore === null ? field.weight : Math.min(bestScore, field.weight);
  }, null);

  let tokenScore = 10;

  for (const token of tokens) {
    const bestTokenScore = fields.reduce<number | null>((bestScore, field) => {
      const fieldScore = getCatalogFieldTokenScore(field, token);

      if (fieldScore === null) {
        return bestScore;
      }

      return bestScore === null ? fieldScore : Math.min(bestScore, fieldScore);
    }, null);

    if (bestTokenScore === null) {
      return null;
    }

    tokenScore += bestTokenScore;
  }

  return exactScore === null ? tokenScore : Math.min(exactScore, tokenScore);
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

function buildCatalogProductWhere(
  data: ReturnType<typeof catalogProductQuerySchema.parse>
): Prisma.ProductWhereInput {
  return {
    active: true,
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
}

async function listProductsWithStockPriority({
  where,
  orderBy,
  skip,
  take
}: {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput[];
  skip: number;
  take: number;
}) {
  const inStockWhere: Prisma.ProductWhereInput = {
    AND: [where, { stock: { gt: 0 } }]
  };
  const outOfStockWhere: Prisma.ProductWhereInput = {
    AND: [where, { stock: { lte: 0 } }]
  };

  const [inStockTotal, outOfStockTotal] = await Promise.all([
    prisma.product.count({ where: inStockWhere }),
    prisma.product.count({ where: outOfStockWhere })
  ]);

  const total = inStockTotal + outOfStockTotal;
  const inStockSkip = Math.min(skip, inStockTotal);
  const inStockTake = Math.max(0, Math.min(take, inStockTotal - inStockSkip));
  const outOfStockSkip = Math.max(0, skip - inStockTotal);
  const outOfStockTake = Math.max(0, take - inStockTake);

  const [inStockProducts, outOfStockProducts] = await Promise.all([
    inStockTake > 0
      ? prisma.product.findMany({
          where: inStockWhere,
          include: productInclude,
          orderBy,
          skip: inStockSkip,
          take: inStockTake
        })
      : Promise.resolve([]),
    outOfStockTake > 0
      ? prisma.product.findMany({
          where: outOfStockWhere,
          include: productInclude,
          orderBy,
          skip: outOfStockSkip,
          take: outOfStockTake
        })
      : Promise.resolve([])
  ]);

  return {
    total,
    products: [...inStockProducts, ...outOfStockProducts]
  };
}

export async function listCatalogProducts(filters: unknown = {}): Promise<CatalogProductsPageDto> {
  const data = catalogProductQuerySchema.parse(filters);
  const page = data.page ?? 1;
  const limit = data.limit ?? 20;

  const where = buildCatalogProductWhere(data);

  if (data.q) {
    const candidates = await prisma.product.findMany({
      where,
      select: catalogSearchSelect,
      orderBy: catalogOrderBy,
      take: 500
    });

    const matches = candidates
      .map((product, index) => ({
        id: product.id,
        index,
        inStock: product.stock > 0,
        score: getCatalogProductSearchScore(product, data.q ?? "")
      }))
      .filter(
        (entry): entry is {
          id: string;
          index: number;
          inStock: boolean;
          score: number;
        } =>
          entry.score !== null
      )
      .sort((left, right) => left.score - right.score || left.index - right.index);

    const orderedMatches = [
      ...matches.filter((entry) => entry.inStock),
      ...matches.filter((entry) => !entry.inStock)
    ];

    const total = orderedMatches.length;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const pageIds = orderedMatches
      .slice((page - 1) * limit, page * limit)
      .map((entry) => entry.id);

    if (pageIds.length === 0) {
      return {
        products: [],
        total,
        page,
        totalPages
      };
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: pageIds
        }
      },
      include: productInclude
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    return {
      products: pageIds
        .map((id) => productsById.get(id))
        .filter(
          (
            product
          ): product is Prisma.ProductGetPayload<{ include: typeof productInclude }> =>
            Boolean(product)
        )
        .map(mapProductCard),
      total,
      page,
      totalPages
    };
  }

  const { total, products } = await listProductsWithStockPriority({
    where,
    orderBy: catalogOrderBy,
    skip: (page - 1) * limit,
    take: limit
  });

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    products: products.map(mapProductCard),
    total,
    page,
    totalPages
  };
}

export async function getFeaturedProducts(limit = 4) {
  const { products } = await listProductsWithStockPriority({
    where: {
      active: true,
      featured: true
    },
    orderBy: [{ featuredPriority: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: 0,
    take: limit
  });

  return products.map(mapProductCard);
}

export async function getHomeProducts(limit = 8) {
  const { products } = await listProductsWithStockPriority({
    where: {
      active: true
    },
    orderBy: catalogOrderBy,
    skip: 0,
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

export async function patchProductStock(id: string, stock: number) {
  const product = await prisma.product.update({
    where: { id },
    data: { stock }
  });

  return { id: product.id, stock: product.stock };
}

export async function createProduct(input: unknown, adminUserId: string) {
  const data = productSchema.parse(input);
  const sku = data.sku?.trim() || generateSku();

  await assertProductDoesNotExist({
    sku,
    name: data.name,
    brand: data.brand
  });
  await assertCategoryExists(data.categoryId);

  const slug = buildProductSlug(data);
  const images = normalizeProductImages(data.images);
  const featuredPriority = data.featured
    ? Math.max(data.featuredPriority ?? 1, 1)
    : DEFAULT_FEATURED_PRIORITY;

  let product;

  try {
    product = await prisma.product.create({
      data: {
        sku,
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
      sku
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
    sku: data.sku ?? existingProduct.sku,
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
          sku: data.sku ?? existingProduct.sku,
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
