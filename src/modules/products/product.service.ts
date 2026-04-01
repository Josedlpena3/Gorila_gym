import { Prisma } from "@prisma/client";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, slugify } from "@/lib/utils";
import {
  productFiltersSchema,
  productSchema
} from "@/modules/products/product.schemas";
import type { ProductCardDto, ProductDetailDto } from "@/types";

const productInclude = {
  category: true,
  images: {
    orderBy: {
      position: "asc" as const
    }
  }
};

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
    image:
      primaryImage?.url ??
      "https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=1200&q=80",
    type: product.type,
    objective: product.objective,
    featured: product.featured
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

export async function listCatalogProducts(filters: unknown = {}) {
  const data = productFiltersSchema.parse(filters);

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
    ...(data.category
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
    ...(data.type
      ? {
          type: data.type
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

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" }
    })
  ]);

  return {
    products: products.map(mapProductCard),
    categories,
    brands: brands.map((entry) => entry.brand)
  };
}

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      featured: true
    },
    include: productInclude,
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return products.map(mapProductCard);
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc"
    }
  });
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
    active: product.active
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
    categoryId: product.categoryId,
    active: product.active
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

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId }
  });

  if (!category) {
    throw new AppError("La categoría seleccionada no existe", 404);
  }

  const slug = slugify(data.slug || data.name);

  const product = await prisma.product.create({
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
      type: data.type,
      objective: data.objective,
      active: data.active,
      featured: data.featured,
      weight: data.weight,
      flavor: data.flavor,
      images: {
        create: data.images.map((url, index) => ({
          url,
          alt: `${data.name} imagen ${index + 1}`,
          position: index,
          isPrimary: index === 0
        }))
      }
    }
  });

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

export async function updateProduct(
  id: string,
  input: unknown,
  adminUserId: string
) {
  const data = productSchema.parse(input);

  const existingProduct = await prisma.product.findUnique({
    where: { id }
  });

  if (!existingProduct) {
    throw new AppError("Producto no encontrado", 404);
  }

  const slug = slugify(data.slug || data.name);

  const product = await prisma.$transaction(async (tx) => {
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
        type: data.type,
        objective: data.objective,
        active: data.active,
        featured: data.featured,
        weight: data.weight,
        flavor: data.flavor,
        images: {
          create: data.images.map((url, index) => ({
            url,
            alt: `${data.name} imagen ${index + 1}`,
            position: index,
            isPrimary: index === 0
          }))
        }
      }
    });
  });

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
