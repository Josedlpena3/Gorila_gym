export type GuestCartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  image: string | null;
};

const GUEST_CART_STORAGE_KEY = "gorila_guest_cart";
const GUEST_CART_EVENT = "gorila-guest-cart-updated";

function canUseBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeItems(input: unknown): GuestCartItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter(
    (entry): entry is GuestCartItem =>
      Boolean(
        entry &&
          typeof entry === "object" &&
          "productId" in entry &&
          "slug" in entry &&
          "name" in entry &&
          "brand" in entry &&
          "quantity" in entry &&
          "unitPrice" in entry &&
          "stock" in entry &&
          typeof entry.productId === "string" &&
          typeof entry.slug === "string" &&
          typeof entry.name === "string" &&
          typeof entry.brand === "string" &&
          typeof entry.quantity === "number" &&
          typeof entry.unitPrice === "number" &&
          typeof entry.stock === "number" &&
          ("image" in entry
            ? entry.image === null || typeof entry.image === "string"
            : true)
      )
  );
}

function notifyGuestCartUpdated() {
  if (!canUseBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(GUEST_CART_EVENT));
}

export function readGuestCartItems() {
  if (!canUseBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return sanitizeItems(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function writeGuestCartItems(items: GuestCartItem[]) {
  if (!canUseBrowser()) {
    return;
  }

  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  notifyGuestCartUpdated();
}

export function clearGuestCart() {
  if (!canUseBrowser()) {
    return;
  }

  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  notifyGuestCartUpdated();
}

export function addGuestCartItem(
  item: Omit<GuestCartItem, "quantity"> & { quantity?: number }
) {
  const current = readGuestCartItems();
  const existingItem = current.find((entry) => entry.productId === item.productId);
  const nextQuantity = Math.min(
    (existingItem?.quantity ?? 0) + (item.quantity ?? 1),
    Math.max(item.stock, 1)
  );

  if (existingItem) {
    writeGuestCartItems(
      current.map((entry) =>
        entry.productId === item.productId
          ? {
              ...entry,
              quantity: nextQuantity,
              unitPrice: item.unitPrice,
              stock: item.stock,
              image: item.image
            }
          : entry
      )
    );
    return;
  }

  writeGuestCartItems([
    ...current,
    {
      ...item,
      quantity: Math.max(item.quantity ?? 1, 1)
    }
  ]);
}

export function updateGuestCartItemQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeGuestCartItem(productId);
    return;
  }

  const current = readGuestCartItems();
  writeGuestCartItems(
    current.map((entry) =>
      entry.productId === productId
        ? {
            ...entry,
            quantity: Math.min(quantity, Math.max(entry.stock, 1))
          }
        : entry
    )
  );
}

export function removeGuestCartItem(productId: string) {
  const current = readGuestCartItems();
  writeGuestCartItems(current.filter((entry) => entry.productId !== productId));
}

export function getGuestCartSnapshot() {
  const items = readGuestCartItems().map((item) => ({
    ...item,
    id: item.productId,
    subtotal: item.unitPrice * item.quantity,
    image: item.image ?? ""
  }));

  return {
    id: "guest-cart",
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.subtotal, 0)
  };
}

export function subscribeToGuestCart(callback: () => void) {
  if (!canUseBrowser()) {
    return () => undefined;
  }

  const handler = () => {
    callback();
  };

  window.addEventListener(GUEST_CART_EVENT, handler);

  return () => {
    window.removeEventListener(GUEST_CART_EVENT, handler);
  };
}

export async function syncGuestCartToServer() {
  const items = readGuestCartItems();

  if (items.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const failedItems: GuestCartItem[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity
        })
      });

      if (!response.ok) {
        failedItems.push(item);
        continue;
      }

      synced += 1;
    } catch {
      failedItems.push(item);
    }
  }

  if (failedItems.length > 0) {
    writeGuestCartItems(failedItems);
  } else {
    clearGuestCart();
  }

  return {
    synced,
    failed: failedItems.length
  };
}
