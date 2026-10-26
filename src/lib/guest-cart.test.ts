import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addGuestCartItem,
  clearGuestCart,
  getGuestCartSnapshot,
  readGuestCartItems,
  removeGuestCartItem,
  updateGuestCartItemQuantity,
  writeGuestCartItems,
  type GuestCartItem
} from "@/lib/guest-cart";

/**
 * El carrito de invitado es la compra de alguien que todavía no tiene cuenta:
 * vive en localStorage y se sincroniza al servidor cuando inicia sesión. Si se
 * corrompe o se pierde, esa persona pierde la compra.
 *
 * Los tests corren en entorno node, así que se arma un localStorage mínimo
 * sobre globalThis.window.
 */
function montarNavegador() {
  const almacen = new Map<string, string>();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (k: string) => almacen.get(k) ?? null,
        setItem: (k: string, v: string) => void almacen.set(k, v),
        removeItem: (k: string) => void almacen.delete(k)
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  });

  // El código despacha un CustomEvent al escribir.
  Object.defineProperty(globalThis, "CustomEvent", {
    configurable: true,
    writable: true,
    value: class {
      constructor(public type: string) {}
    }
  });

  return almacen;
}

const PRODUCTO = {
  productId: "prod-1",
  slug: "creatina-fruit-punch",
  name: "Creatina Fruit Punch",
  brand: "Star Nutrition",
  unitPrice: 30000,
  stock: 10,
  image: null
};

let almacen: Map<string, string>;

beforeEach(() => {
  almacen = montarNavegador();
});

afterEach(() => {
  // @ts-expect-error se desmonta el navegador simulado
  delete globalThis.window;
});

describe("agregar al carrito de invitado", () => {
  it("guarda el producto con cantidad 1 por defecto", () => {
    addGuestCartItem(PRODUCTO);

    const items = readGuestCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("prod-1");
    expect(items[0].quantity).toBe(1);
  });

  it("acumula la cantidad en vez de duplicar el producto", () => {
    addGuestCartItem(PRODUCTO);
    addGuestCartItem({ ...PRODUCTO, quantity: 2 });

    const items = readGuestCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("no deja superar el stock disponible", () => {
    addGuestCartItem({ ...PRODUCTO, stock: 2, quantity: 5 });

    expect(readGuestCartItems()[0].quantity).toBeLessThanOrEqual(2);
  });

  it("mantiene separados dos productos distintos", () => {
    addGuestCartItem(PRODUCTO);
    addGuestCartItem({ ...PRODUCTO, productId: "prod-2", name: "Whey" });

    expect(readGuestCartItems()).toHaveLength(2);
  });
});

describe("modificar el carrito", () => {
  it("actualiza la cantidad de un producto", () => {
    addGuestCartItem(PRODUCTO);
    updateGuestCartItemQuantity("prod-1", 4);

    expect(readGuestCartItems()[0].quantity).toBe(4);
  });

  it("poner cantidad cero equivale a quitarlo", () => {
    addGuestCartItem(PRODUCTO);
    updateGuestCartItemQuantity("prod-1", 0);

    expect(readGuestCartItems()).toHaveLength(0);
  });

  it("no deja subir la cantidad por encima del stock", () => {
    addGuestCartItem({ ...PRODUCTO, stock: 3 });
    updateGuestCartItemQuantity("prod-1", 99);

    expect(readGuestCartItems()[0].quantity).toBeLessThanOrEqual(3);
  });

  it("quita un producto por id sin tocar los demás", () => {
    addGuestCartItem(PRODUCTO);
    addGuestCartItem({ ...PRODUCTO, productId: "prod-2" });
    removeGuestCartItem("prod-1");

    const items = readGuestCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("prod-2");
  });

  it("vacía el carrito completo", () => {
    addGuestCartItem(PRODUCTO);
    clearGuestCart();

    expect(readGuestCartItems()).toHaveLength(0);
  });
});

describe("getGuestCartSnapshot", () => {
  it("calcula subtotal por producto y total del carrito", () => {
    addGuestCartItem({ ...PRODUCTO, quantity: 2 });
    addGuestCartItem({
      ...PRODUCTO,
      productId: "prod-2",
      unitPrice: 5000,
      quantity: 3
    });

    const snapshot = getGuestCartSnapshot();

    expect(snapshot.subtotal).toBe(2 * 30000 + 3 * 5000);
    expect(snapshot.itemCount).toBe(5);
    expect(snapshot.items).toHaveLength(2);
  });

  it("devuelve un carrito vacío coherente", () => {
    const snapshot = getGuestCartSnapshot();

    expect(snapshot.items).toHaveLength(0);
    expect(snapshot.subtotal).toBe(0);
    expect(snapshot.itemCount).toBe(0);
  });
});

describe("tolerancia a datos corruptos", () => {
  it("devuelve vacío si el localStorage tiene JSON inválido", () => {
    almacen.set("gorila_guest_cart", "{esto no es json");

    expect(readGuestCartItems()).toEqual([]);
  });

  it("descarta entradas que no tienen la forma esperada", () => {
    almacen.set(
      "gorila_guest_cart",
      JSON.stringify([
        { productId: "ok", slug: "s", name: "n", brand: "b", quantity: 1, unitPrice: 10, stock: 5, image: null },
        { productId: "roto" },
        null,
        "texto suelto"
      ])
    );

    const items = readGuestCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("ok");
  });

  it("sin navegador (SSR) devuelve vacío en vez de romper", () => {
    // @ts-expect-error se simula el render del servidor
    delete globalThis.window;

    expect(readGuestCartItems()).toEqual([]);
    expect(() => writeGuestCartItems([] as GuestCartItem[])).not.toThrow();
    expect(() => clearGuestCart()).not.toThrow();
  });
});
