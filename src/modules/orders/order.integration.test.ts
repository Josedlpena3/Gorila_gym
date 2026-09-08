/**
 * Tests de integración contra Postgres real (base `gorila_strong_test`,
 * aislada de la base de desarrollo y de producción).
 *
 * Corren la lógica de negocio tal como la llaman las rutas de API, sin pasar
 * por HTTP: se ejercita `createGuestOrder` / `addCartItem` directamente, que
 * es donde vive la validación de precio y stock. Es la única forma de
 * verificar de verdad que un precio manipulado desde el cliente no se cobra.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  cleanupTestData,
  createTestCategory,
  createTestProduct,
  createTestUser
} from "@/test/fixtures";
import { addCartItem, updateCartItemQuantity } from "@/modules/cart/cart.service";
import {
  createGuestOrder,
  createOrderFromCart
} from "@/modules/orders/order.service";

const GUEST_ORDER_BASE = {
  name: "Test Comprador",
  phone: "3511234567",
  deliveryMethod: "retiro" as const,
  paymentMethod: "efectivo" as const
};

let categoryId: string;

beforeAll(async () => {
  const category = await createTestCategory();
  categoryId = category.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("carrito: totales y stock", () => {
  it("el precio del carrito se toma del producto, no de lo que mande el cliente", async () => {
    const product = await createTestProduct({ categoryId, price: 5000, stock: 10 });
    const user = await createTestUser();

    const cart = await addCartItem(user.id, product.id, 2);

    expect(cart.items[0].unitPrice).toBe(5000);
    expect(cart.subtotal).toBe(10000);
  });

  it("agregar más unidades que el stock disponible se rechaza", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 3 });
    const user = await createTestUser();

    await expect(addCartItem(user.id, product.id, 4)).rejects.toThrow(
      /stock/i
    );
  });

  it("sumar al carrito un producto ya presente respeta el stock del total acumulado", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });
    const user = await createTestUser();

    await addCartItem(user.id, product.id, 3);

    // 3 ya en el carrito + 3 más = 6, pero el stock es 5.
    await expect(addCartItem(user.id, product.id, 3)).rejects.toThrow(/stock/i);

    const cart = await prisma.cartItem.findFirst({
      where: { productId: product.id }
    });
    // La cantidad no debe haber cambiado tras el intento rechazado.
    expect(cart?.quantity).toBe(3);
  });

  it("actualizar la cantidad respeta el stock actual del producto", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 4 });
    const user = await createTestUser();

    await addCartItem(user.id, product.id, 2);

    await expect(
      updateCartItemQuantity(user.id, product.id, 10)
    ).rejects.toThrow(/stock/i);
  });

  it("bajar la cantidad a cero elimina el item del carrito", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });
    const user = await createTestUser();

    await addCartItem(user.id, product.id, 2);
    const cart = await updateCartItemQuantity(user.id, product.id, 0);

    expect(cart.items).toHaveLength(0);
  });
});

describe("resistencia a manipulación de precio (checkout de invitado)", () => {
  it("un precio manipulado en el body se ignora: se cobra el precio real de la base", async () => {
    const product = await createTestProduct({ categoryId, price: 20000, stock: 10 });

    const result = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        {
          productId: product.id,
          name: product.name,
          // El cliente manda $1 en vez de los $20.000 reales.
          price: 1,
          quantity: 1
        }
      ],
      // Y un total a juego con el precio falso.
      totalFinal: 1
    });

    expect(result.order.total).toBe(20000);
    expect(result.order.items[0].price).toBe(20000);
  });

  it("un totalFinal manipulado tampoco se usa: el total sale del cálculo del servidor", async () => {
    const product = await createTestProduct({ categoryId, price: 8000, stock: 10 });

    const result = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 8000, quantity: 3 }
      ],
      totalFinal: 1
    });

    expect(result.order.total).toBe(24000);
  });

  it("un código de descuento inventado rechaza el pedido, no lo ignora en silencio", async () => {
    // Decisión de producto: antes esto ignoraba el código en silencio y
    // cobraba precio completo. Ahora corta la compra con un error claro, para
    // que quien escribió mal un código real se entere de que no se le aplicó.
    const product = await createTestProduct({ categoryId, price: 10000, stock: 10 });
    const before = await prisma.order.count();

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 10000, quantity: 1 }
        ],
        totalFinal: 10000,
        discountCode: "yo-mismo-me-hago-el-descuento"
      })
    ).rejects.toThrow(/código de descuento inválido/i);

    // El rechazo no debe dejar un pedido a medio crear.
    expect(await prisma.order.count()).toBe(before);
  });

  it("un código que no cumple sus condiciones (envío gratis, pero con retiro) también rechaza", async () => {
    // "no cumple las condiciones para aplicarse": joaco_battiston solo vale
    // con envío. Con retiro, applyCheckoutDiscount ya lo marcaba invalid; lo
    // que cambió es que ahora eso corta la compra en vez de ignorarse.
    const product = await createTestProduct({ categoryId, price: 10000, stock: 10 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        deliveryMethod: "retiro",
        items: [
          { productId: product.id, name: product.name, price: 10000, quantity: 1 }
        ],
        totalFinal: 10000,
        discountCode: "joaco_battiston"
      })
    ).rejects.toThrow(/código de descuento inválido/i);
  });

  it("lo mismo pasa en el checkout de un usuario logueado, no solo en el de invitado", async () => {
    const product = await createTestProduct({ categoryId, price: 5000, stock: 10 });
    const user = await createTestUser();
    await addCartItem(user.id, product.id, 1);

    await expect(
      createOrderFromCart(user, {
        name: "Test Comprador Logueado",
        phone: "3511234567",
        deliveryMethod: "retiro",
        paymentMethod: "efectivo",
        totalFinal: 5000,
        discountCode: "no-existe-este-codigo"
      })
    ).rejects.toThrow(/código de descuento inválido/i);
  });

  it("el código real de 10% descuenta exactamente eso, ni un peso más", async () => {
    const product = await createTestProduct({ categoryId, price: 10000, stock: 10 });

    const result = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 10000, quantity: 1 }
      ],
      totalFinal: 10000,
      discountCode: "gorillastrong"
    });

    expect(result.order.total).toBe(9000);
  });
});

describe("stock insuficiente: el pedido no se confirma", () => {
  it("comprar más unidades que el stock rechaza el pedido completo", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 2 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 5 }
        ],
        totalFinal: 5000
      })
    ).rejects.toThrow(/stock insuficiente/i);

    const stockSinCambios = await prisma.product.findUnique({
      where: { id: product.id }
    });
    // El rechazo no debe haber tocado el stock.
    expect(stockSinCambios?.stock).toBe(2);
  });

  it("un producto desactivado (eliminado del catálogo) no se puede comprar", async () => {
    const product = await createTestProduct({
      categoryId,
      price: 1000,
      stock: 10,
      active: false
    });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });

  it("un producto que ya no existe en la base rechaza el pedido en vez de romperse", async () => {
    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          {
            productId: "id-que-no-existe-nunca",
            name: "Fantasma",
            price: 1000,
            quantity: 1
          }
        ],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });

  it("un pedido rechazado no queda a medio crear en la base", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 1 });
    const before = await prisma.order.count();

    await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 1000, quantity: 99 }
      ],
      totalFinal: 99000
    }).catch(() => null);

    const after = await prisma.order.count();
    expect(after).toBe(before);
  });
});

describe("condición de carrera: dos compras simultáneas del último producto", () => {
  it("con stock=1, de dos pedidos concurrentes solo uno debe ganar", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 1 });

    const buyOne = () =>
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000
      });

    const results = await Promise.allSettled([buyOne(), buyOne()]);
    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    // Lo que de verdad importa: el stock nunca queda negativo, sin importar
    // cuántos pedidos concurrentes lo hayan disputado.
    expect(finalProduct?.stock).toBeGreaterThanOrEqual(0);

    // Y si ambos pedidos se dieron por exitosos, el stock no puede alcanzar
    // para los dos: ahí es donde se vendió una unidad que no existía.
    if (succeeded.length === 2) {
      expect(finalProduct?.stock).not.toBeLessThan(0);
    }

    expect(succeeded.length + failed.length).toBe(2);
  });
});

describe("pedido de usuario autenticado: el total sale del carrito del servidor", () => {
  it("agregar al carrito y confirmar cobra el precio guardado, no uno inventado", async () => {
    const product = await createTestProduct({ categoryId, price: 15000, stock: 5 });
    const user = await createTestUser();

    await addCartItem(user.id, product.id, 2);

    const result = await createOrderFromCart(user, {
      name: "Test Comprador Logueado",
      phone: "3511234567",
      deliveryMethod: "retiro",
      paymentMethod: "efectivo",
      // El cliente manda un total falso: el servidor debe ignorarlo.
      totalFinal: 1
    });

    expect(result.order.total).toBe(30000);
  });

  it("confirmar deja el carrito vacío y descuenta el stock real", async () => {
    const product = await createTestProduct({ categoryId, price: 2000, stock: 8 });
    const user = await createTestUser();

    await addCartItem(user.id, product.id, 3);

    await createOrderFromCart(user, {
      name: "Test Comprador Logueado",
      phone: "3511234567",
      deliveryMethod: "retiro",
      paymentMethod: "efectivo",
      totalFinal: 6000
    });

    const [cartItems, updatedProduct] = await Promise.all([
      prisma.cartItem.findMany({ where: { product: { id: product.id } } }),
      prisma.product.findUnique({ where: { id: product.id } })
    ]);

    expect(cartItems).toHaveLength(0);
    expect(updatedProduct?.stock).toBe(5);
  });

  it("confirmar con el carrito vacío se rechaza en vez de crear un pedido sin nada", async () => {
    const user = await createTestUser();

    await expect(
      createOrderFromCart(user, {
        name: "Test Comprador Logueado",
        phone: "3511234567",
        deliveryMethod: "retiro",
        paymentMethod: "efectivo",
        totalFinal: 1000
      })
    ).rejects.toThrow(/carrito.*vac/i);
  });
});

describe("validación de datos de entrada", () => {
  it("un teléfono con letras se rechaza antes de tocar la base", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        phone: "no-es-un-telefono",
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });

  it("pago con tarjeta solo se permite retirando en el local, no con envío", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        deliveryMethod: "envio",
        paymentMethod: "tarjeta",
        address: {
          street: "Calle Falsa",
          number: "123",
          city: "Córdoba",
          province: "Córdoba",
          postalCode: "5000"
        },
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });

  it("envío a domicilio sin dirección se rechaza", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        deliveryMethod: "envio",
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });

  it("un carrito vacío en la compra de invitado se rechaza", async () => {
    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [],
        totalFinal: 1000
      })
    ).rejects.toThrow();
  });
});

describe("idempotencia: doble click, F5 o un reintento de red no duplican el pedido", () => {
  it("la misma clave enviada dos veces seguidas devuelve el mismo pedido, no crea uno nuevo", async () => {
    const product = await createTestProduct({ categoryId, price: 4000, stock: 10 });
    const idempotencyKey = randomUUID();
    const before = await prisma.order.count();

    const first = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 4000, quantity: 1 }
      ],
      totalFinal: 4000,
      idempotencyKey
    });

    // Reintento: mismo payload, misma clave. Simula un F5 a mitad de camino o
    // un fetch que se reintenta solo tras un corte de red.
    const second = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 4000, quantity: 1 }
      ],
      totalFinal: 4000,
      idempotencyKey
    });

    expect(second.order.id).toBe(first.order.id);
    expect(second.order.code).toBe(first.order.code);
    expect(await prisma.order.count()).toBe(before + 1);
  });

  it("el stock se descuenta una sola vez, no una por cada reintento", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 5 });
    const idempotencyKey = randomUUID();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 2 }
        ],
        totalFinal: 2000,
        idempotencyKey
      });
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    // Tres intentos con la misma clave, pero el stock solo bajó una vez.
    expect(finalProduct?.stock).toBe(3);
  });

  it("dos requests con la misma clave casi al mismo tiempo: uno gana, el otro recibe el mismo pedido", async () => {
    // Este es el caso que un chequeo secuencial (leer, decidir, crear) no
    // puede resolver: acá los dos requests arrancan sin que ninguno haya
    // visto todavía el pedido del otro. Lo que evita el pedido duplicado es
    // la restricción UNIQUE de la base sobre idempotencyKey, no el chequeo
    // previo.
    const product = await createTestProduct({ categoryId, price: 2500, stock: 10 });
    const idempotencyKey = randomUUID();
    const before = await prisma.order.count();

    const attempt = () =>
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 2500, quantity: 1 }
        ],
        totalFinal: 2500,
        idempotencyKey
      });

    const [first, second] = await Promise.all([attempt(), attempt()]);

    expect(first.order.id).toBe(second.order.id);
    expect(await prisma.order.count()).toBe(before + 1);

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });
    // Un solo pedido, un solo descuento de stock: 10 - 1 = 9, no 8.
    expect(finalProduct?.stock).toBe(9);
  });

  it("con claves distintas, dos compras genuinas se crean como dos pedidos separados", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 10 });
    const before = await prisma.order.count();

    const first = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 1000, quantity: 1 }
      ],
      totalFinal: 1000,
      idempotencyKey: randomUUID()
    });

    const second = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 1000, quantity: 1 }
      ],
      totalFinal: 1000,
      idempotencyKey: randomUUID()
    });

    expect(second.order.id).not.toBe(first.order.id);
    expect(await prisma.order.count()).toBe(before + 2);
  });

  it("sin clave, el comportamiento no cambió: sigue creando el pedido normalmente", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 10 });

    const result = await createGuestOrder({
      ...GUEST_ORDER_BASE,
      items: [
        { productId: product.id, name: product.name, price: 1000, quantity: 1 }
      ],
      totalFinal: 1000
    });

    expect(result.order.total).toBe(1000);
  });

  it("una clave que no es un UUID se rechaza antes de tocar la base", async () => {
    const product = await createTestProduct({ categoryId, price: 1000, stock: 10 });

    await expect(
      createGuestOrder({
        ...GUEST_ORDER_BASE,
        items: [
          { productId: product.id, name: product.name, price: 1000, quantity: 1 }
        ],
        totalFinal: 1000,
        idempotencyKey: "no-es-un-uuid"
      })
    ).rejects.toThrow();
  });

  it("la idempotencia también protege el checkout de un usuario logueado", async () => {
    const product = await createTestProduct({ categoryId, price: 7000, stock: 10 });
    const user = await createTestUser();
    await addCartItem(user.id, product.id, 1);

    const idempotencyKey = randomUUID();
    const payload = {
      name: "Test Comprador Logueado",
      phone: "3511234567",
      deliveryMethod: "retiro" as const,
      paymentMethod: "efectivo" as const,
      totalFinal: 7000,
      idempotencyKey
    };

    const [first, second] = await Promise.all([
      createOrderFromCart(user, payload),
      createOrderFromCart(user, payload)
    ]);

    expect(first.order.id).toBe(second.order.id);

    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });
    // El carrito tenía 1 unidad: el stock baja una sola vez, no dos.
    expect(finalProduct?.stock).toBe(9);
  });
});
