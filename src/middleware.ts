import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

type SessionPayload = {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type GlobalRateLimitState = typeof globalThis & {
  __gorilaRateLimitStore?: Map<string, RateLimitEntry>;
  __gorilaRateLimitLastCleanup?: number;
};

const LOGIN_PATH = "/login";
const HOME_PATH = "/";
const PUBLIC_API_PREFIX = "/api/public";
const DANGEROUS_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const PUBLIC_API_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email"
]);

const globalRateLimitState = globalThis as GlobalRateLimitState;
const rateLimitStore =
  globalRateLimitState.__gorilaRateLimitStore ??
  (globalRateLimitState.__gorilaRateLimitStore = new Map<string, RateLimitEntry>());

function buildContentSecurityPolicy(pathname: string) {
  if (pathname.startsWith("/api/")) {
    return "default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline';";
  }

  // Next.js App Router in HTML responses still relies on inline bootstrap scripts.
  return "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
}

function addSecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(pathname)
  );

  return response;
}

function isAdminPage(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminApi(pathname: string) {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function isPublicApi(pathname: string) {
  return (
    pathname === PUBLIC_API_PREFIX ||
    pathname.startsWith(`${PUBLIC_API_PREFIX}/`) ||
    PUBLIC_API_ROUTES.has(pathname)
  );
}

function isProtectedProductsWrite(request: NextRequest) {
  return request.nextUrl.pathname === "/api/products" && DANGEROUS_METHODS.has(request.method);
}

function requiresAuthenticatedWrite(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/") || isPublicApi(pathname)) {
    return false;
  }

  return DANGEROUS_METHODS.has(request.method);
}

function getSessionToken(request: NextRequest) {
  return (
    request.cookies.get(AUTH_COOKIE_NAME)?.value ??
    request.cookies.get("token")?.value ??
    null
  );
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function cleanupRateLimitEntries(now: number) {
  const lastCleanup = globalRateLimitState.__gorilaRateLimitLastCleanup ?? 0;

  if (now - lastCleanup < RATE_LIMIT_WINDOW_MS) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  globalRateLimitState.__gorilaRateLimitLastCleanup = now;
}

function applyRateLimit(request: NextRequest) {
  const now = Date.now();
  cleanupRateLimitEntries(now);

  const ip = getClientIp(request);
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });

    return null;
  }

  current.count += 1;

  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[middleware] acceso rechazado`, {
      path: request.nextUrl.pathname,
      method: request.method,
      reason: "rate_limited"
    });

    return addSecurityHeaders(
      NextResponse.json(
        { error: "Demasiadas solicitudes" },
        { status: 429 }
      ),
      request.nextUrl.pathname
    );
  }

  rateLimitStore.set(ip, current);
  return null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(`${normalized}${padding}`);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson<T>(value: string) {
  const bytes = decodeBase64Url(value);
  const text = new TextDecoder().decode(bytes);

  return JSON.parse(text) as T;
}

async function verifyJwt(token: string, secret: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = decodeJson<{ alg?: string; typ?: string }>(encodedHeader);

    if (header.alg !== "HS256" || (header.typ && header.typ !== "JWT")) {
      return null;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = decodeBase64Url(encodedSignature);
    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!isValid) {
      return null;
    }

    const payload = decodeJson<SessionPayload>(encodedPayload);

    if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
      return null;
    }

    if (
      typeof payload.exp === "number" &&
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return loginUrl;
}

function rejectUnauthorized(request: NextRequest, reason: string) {
  console.warn(`[middleware] acceso rechazado`, {
    path: request.nextUrl.pathname,
    method: request.method,
    reason
  });

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return addSecurityHeaders(
      NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
      request.nextUrl.pathname
    );
  }

  return addSecurityHeaders(
    NextResponse.redirect(buildLoginRedirect(request)),
    request.nextUrl.pathname
  );
}

function rejectForbidden(request: NextRequest, reason: string) {
  console.warn(`[middleware] acceso rechazado`, {
    path: request.nextUrl.pathname,
    method: request.method,
    reason
  });

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return addSecurityHeaders(
      NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      ),
      request.nextUrl.pathname
    );
  }

  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = HOME_PATH;
  homeUrl.search = "";

  return addSecurityHeaders(
    NextResponse.redirect(homeUrl),
    request.nextUrl.pathname
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rateLimitResponse = applyRateLimit(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (isPublicApi(pathname)) {
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  const needsAdmin = isAdminPage(pathname) || isAdminApi(pathname);
  const needsAuthenticatedWrite =
    requiresAuthenticatedWrite(request) || isProtectedProductsWrite(request);
  const needsAuth = needsAdmin || needsAuthenticatedWrite;

  if (!needsAuth) {
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  const secret = process.env.JWT_SECRET?.trim() ?? "";

  if (!secret) {
    return rejectUnauthorized(request, "missing_secret");
  }

  const token = getSessionToken(request);

  if (!token) {
    return rejectUnauthorized(request, "missing_token");
  }

  const payload = await verifyJwt(token, secret);

  if (!payload) {
    return rejectUnauthorized(request, "invalid_token");
  }

  if (needsAdmin && payload.role !== "ADMIN") {
    return rejectForbidden(request, "admin_required");
  }

  return addSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"]
};
