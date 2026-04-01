import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import type { CartDto } from "@/types";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: {
            orderBy: {
              position: "asc" as const
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc" as const
    }
  }
};

function mapCart(cart: Awaited<ReturnType<typeof getOrCreateCartInternal>>): CartDto {
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    brand: item.product.brand,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice) ?? 0,
    subtotal: (decimalToNumber(item.unitPrice) ?? 0) * item.quantity,
    stock: item.product.stock,
    image:
      item.product.images.find((image) => image.isPrimary)?.url ??
      item.product.images[0]?.url ??
      ""
  }));

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.subtotal, 0)
  };
}

async function getOrCreateCartInternal(userId: string) {
  const existingCart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude
  });

  if (existingCart) {
    return existingCart;
  }

  return prisma.cart.create({
    data: {
      userId
    },
    include: cartInclude
  });
}

export async function getCartByUserId(userId: string) {
  const cart = await getOrCreateCartInternal(userId);
  return mapCart(cart);
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity = 1
) {
  if (quantity <= 0) {
    throw new AppError("La cantidad debe ser mayor a cero");
  }

  const [cart, product] = await Promise.all([
    getOrCreateCartInternal(userId),
    prisma.product.findUnique({
      where: { id: productId }
    })
  ]);

  if (!product || !product.active) {
    throw new AppError("El producto no está disponible", 404);
  }

  const existingItem = cart.items.find((item) => item.productId === productId);
  const nextQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock) {
    throw new AppError("No hay stock suficiente para esa cantidad");
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId
      }
    },
    update: {
      quantity: nextQuantity,
      unitPrice: product.price
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
      unitPrice: product.price
    }
  });

  return getCartByUserId(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  if (quantity < 0) {
    throw new AppError("Cantidad inválida");
  }

  const cart = await getOrCreateCartInternal(userId);

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId
      }
    });

    return getCartByUserId(userId);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product || quantity > product.stock) {
    throw new AppError("No hay stock suficiente");
  }

  await prisma.cartItem.update({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId
      }
    },
    data: {
      quantity,
      unitPrice: product.price
    }
  });

  return getCartByUserId(userId);
}

export async function removeCartItem(userId: string, productId: string) {
  const cart = await getOrCreateCartInternal(userId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId
    }
  });

  return getCartByUserId(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCartInternal(userId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id
    }
  });

  return getCartByUserId(userId);
}

