const STORAGE_KEY = "gorila_checkout_idempotency_key";

function canUseBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/**
 * Clave que identifica un intento de compra, para que un doble click, un F5 o
 * un reintento de red no le hagan crear dos pedidos al servidor.
 *
 * Vive en `sessionStorage`, no en un `useState`: un estado de React no
 * sobrevive una recarga de página, y "el usuario recarga a mitad del
 * checkout" es justo uno de los casos que hay que cubrir. Se genera una sola
 * vez por intento —la primera vez que se pide— y de ahí en más siempre se
 * devuelve la misma, así que todos los reintentos del mismo intento de compra
 * mandan la misma clave.
 */
export function getCheckoutIdempotencyKey(): string {
  if (!canUseBrowser()) {
    // SSR o un entorno sin sessionStorage: no hay reintento posible que
    // deduplicar, así que una clave nueva en cada llamada no rompe nada.
    return crypto.randomUUID();
  }

  const existing = window.sessionStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const key = crypto.randomUUID();
  window.sessionStorage.setItem(STORAGE_KEY, key);

  return key;
}

/**
 * Se llama una vez que el pedido se confirmó. Sin esto, la clave del intento
 * que ya terminó bien quedaría pegada en sessionStorage y una compra
 * genuinamente nueva —del mismo tab, más tarde— la reutilizaría: el servidor
 * la vería como un reintento y devolvería el pedido viejo en vez de crear el
 * nuevo.
 */
export function clearCheckoutIdempotencyKey() {
  if (!canUseBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
