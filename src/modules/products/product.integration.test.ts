/**
 * Tests de integración del servicio de productos contra Postgres real.
 *
 * El caso que motiva este archivo es concreto: cambiar la categoría de un
 * producto desde el panel no tenía efecto. Ese bug era de estado en el cliente,
 * pero nada verificaba que la cadena completa —servicio, validación y
 * persistencia— dejara la categoría nueva guardada y visible en el catálogo.
 */
import { Objective } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  cleanupTestData,
  createTestAdmin,
  createTestCategory,
  createTestProduct
} from "@/test/fixtures";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  updateProduct
} from "@/modules/products/product.service";

let adminId: string;
let categoriaA: { id: string; name: string };
let categoriaB: { id: string; name: string };

/** Payload mínimo que `productSchema` acepta. */
function payloadProducto(overrides: Record<string, unknown> = {}) {
  return {
    name: `Producto de test ${Date.now()}-${Math.random()}`,
    brand: "Marca Test",
    categoryId: categoriaA.id,
    description: "Descripción de producto de prueba con más de veinte caracteres.",
    price: 10000,
    stock: 5,
    objective: Objective.PERFORMANCE,
    benefits: [],
    images: [],
    ...overrides
  };
}

beforeAll(async () => {
  const admin = await createTestAdmin();
  adminId = admin.id;
  categoriaA = await createTestCategory();
  categoriaB = await createTestCategory();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("cambiar la categoría de un producto", () => {
  it("persiste la categoría nueva", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });

    await updateProduct(
      producto.id,
      payloadProducto({
        name: producto.name,
        categoryId: categoriaB.id
      }),
      adminId
    );

    const actualizado = await prisma.product.findUnique({
      where: { id: producto.id },
      select: { categoryId: true }
    });

    expect(actualizado?.categoryId).toBe(categoriaB.id);
    expect(actualizado?.categoryId).not.toBe(categoriaA.id);
  });

  it("el producto queda visible bajo la categoría nueva", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });

    await updateProduct(
      producto.id,
      payloadProducto({ name: producto.name, categoryId: categoriaB.id }),
      adminId
    );

    const enCategoriaB = await prisma.product.findMany({
      where: { categoryId: categoriaB.id, id: producto.id },
      select: { id: true }
    });
    const enCategoriaA = await prisma.product.findMany({
      where: { categoryId: categoriaA.id, id: producto.id },
      select: { id: true }
    });

    expect(enCategoriaB).toHaveLength(1);
    expect(enCategoriaA).toHaveLength(0);
  });

  it("rechaza una categoría que no existe en vez de guardar una FK rota", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });

    await expect(
      updateProduct(
        producto.id,
        payloadProducto({
          name: producto.name,
          categoryId: "categoria-que-no-existe"
        }),
        adminId
      )
    ).rejects.toThrow();

    const sinCambios = await prisma.product.findUnique({
      where: { id: producto.id },
      select: { categoryId: true }
    });

    expect(sinCambios?.categoryId).toBe(categoriaA.id);
  });

  it("cambiar la categoría no pisa el resto de los datos", async () => {
    const producto = await createTestProduct({
      categoryId: categoriaA.id,
      price: 25000,
      stock: 7
    });

    await updateProduct(
      producto.id,
      payloadProducto({
        name: producto.name,
        categoryId: categoriaB.id,
        price: 25000,
        stock: 7
      }),
      adminId
    );

    const actualizado = await prisma.product.findUnique({
      where: { id: producto.id }
    });

    expect(actualizado?.categoryId).toBe(categoriaB.id);
    expect(Number(actualizado?.price)).toBe(25000);
    expect(actualizado?.stock).toBe(7);
    expect(actualizado?.name).toBe(producto.name);
  });
});

describe("crear producto", () => {
  it("genera slug y SKU cuando no se los mandan", async () => {
    const creado = await createProduct(payloadProducto(), adminId);

    expect(creado.slug).toBeTruthy();
    expect(creado.sku).toBeTruthy();
    expect(creado.categoryId).toBe(categoriaA.id);
  });

  it("rechaza una descripción demasiado corta", async () => {
    await expect(
      createProduct(payloadProducto({ description: "corta" }), adminId)
    ).rejects.toThrow();
  });

  it("rechaza un precio negativo", async () => {
    await expect(
      createProduct(payloadProducto({ price: -100 }), adminId)
    ).rejects.toThrow();
  });

  it("rechaza una categoría inexistente", async () => {
    await expect(
      createProduct(payloadProducto({ categoryId: "no-existe" }), adminId)
    ).rejects.toThrow();
  });
});

describe("visibilidad en la tienda", () => {
  it("getProductBySlug no devuelve un producto inactivo", async () => {
    const producto = await createTestProduct({
      categoryId: categoriaA.id,
      active: false
    });

    expect(await getProductBySlug(producto.slug)).toBeNull();
  });

  it("getProductBySlug devuelve el producto activo con su categoría", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });
    const encontrado = await getProductBySlug(producto.slug);

    expect(encontrado).not.toBeNull();
    expect(encontrado?.category).toBe(categoriaA.name);
  });

  it("la categoría que devuelve la ficha refleja el cambio", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });

    await updateProduct(
      producto.id,
      payloadProducto({ name: producto.name, categoryId: categoriaB.id }),
      adminId
    );

    const actualizado = await prisma.product.findUnique({
      where: { id: producto.id },
      select: { slug: true }
    });
    const ficha = await getProductBySlug(actualizado!.slug);

    expect(ficha?.category).toBe(categoriaB.name);
  });
});

describe("eliminar producto", () => {
  it("borra un producto que nunca se vendió", async () => {
    const producto = await createTestProduct({ categoryId: categoriaA.id });

    await deleteProduct(producto.id, adminId);

    expect(
      await prisma.product.findUnique({ where: { id: producto.id } })
    ).toBeNull();
  });

  it("falla con un id que no existe", async () => {
    await expect(deleteProduct("no-existe", adminId)).rejects.toThrow();
  });
});
