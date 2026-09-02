/**
 * Cliente HTTP del frontend.
 *
 * Había 30 llamadas a `fetch` repartidas en 24 archivos, cada una repitiendo el
 * mismo bloque: método, Content-Type, JSON.stringify, `response.ok`,
 * `json().catch(() => null)` y su propia forma de leer el error. Agregar un
 * header, un timeout o un reintento obligaba a tocar las 30.
 */

const DEFAULT_ERROR_MESSAGE = "No se pudo completar la operación.";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  /** Segundos a esperar ante un 429, leídos de la cabecera `Retry-After`. */
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    status: number,
    payload: unknown,
    retryAfterSeconds: number | null
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type RequestOptions = {
  /** Mensaje a mostrar si la respuesta de error no trae uno propio. */
  fallbackMessage?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const hasBody = body !== undefined;
  // FormData lleva su propio Content-Type con el boundary: fijarlo a mano rompe
  // la subida de archivos.
  const isFormData = body instanceof FormData;

  const response = await fetch(path, {
    method,
    headers: hasBody && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal: options.signal,
    cache: options.cache
  });

  const payload = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: string })
    | null;

  if (!response.ok) {
    const header = Number(response.headers.get("Retry-After"));

    throw new ApiError(
      payload?.error ?? options.fallbackMessage ?? DEFAULT_ERROR_MESSAGE,
      response.status,
      payload,
      Number.isFinite(header) ? header : null
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("DELETE", path, body, options)
};

/**
 * Mensaje presentable para el usuario a partir de cualquier error capturado.
 * Un fallo de red no produce ApiError sino TypeError, y ese mensaje del
 * navegador ("Failed to fetch") no se le muestra a nadie.
 */
export function getApiErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

export function isApiErrorWithStatus(error: unknown, status: number) {
  return error instanceof ApiError && error.status === status;
}
