import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, VALID_AUTH_ROLES } from "@/lib/auth-constants";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";

type SessionPayload = {
  sub?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

const LOGIN_PATH = "/login";
const HOME_PATH = "/";
const PUBLIC_API_PREFIX = "/api/public";
const AUTH_API_PREFIX = "/api/auth";
const DANGEROUS_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function buildContentSecurityPolicy(pathname: string) {
  if (pathname.startsWith("/api/")) {
    return "default-src 'none';";
  }

  return [
    "default-src 'self';",
    "img-src 'self' https: data: blob:;",
    "script-src 'self' 'unsafe-inline';",
    "style-src 'self' 'unsafe-inline';",
    "object-src 'none';",
    "base-uri 'self';"
  ].join(" ");
}

function addSecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(pathname)
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

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
    pathname === AUTH_API_PREFIX ||
    pathname.startsWith(`${AUTH_API_PREFIX}/`)
  );
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

async function applyApiRateLimit(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return null;
  }

  const ip = getRequestIp(request.headers);
  const result = await consumeRateLimit({
    key: ip,
    prefix: "api:ip",
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });

  if (!result.limited) {
    return null;
  }

  console.warn("[middleware] acceso rechazado", {
    path: request.nextUrl.pathname,
    method: request.method,
    reason: "rate_limited"
  });

  const response = NextResponse.json(
    { error: "Demasiadas solicitudes" },
    { status: 429 }
  );

  response.headers.set("Retry-After", `${result.retryAfterSeconds}`);
  return addSecurityHeaders(response, request.nextUrl.pathname);
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
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    if (
      typeof payload.role !== "string" ||
      !VALID_AUTH_ROLES.includes(payload.role as (typeof VALID_AUTH_ROLES)[number])
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
  console.warn("[middleware] acceso rechazado", {
    path: request.nextUrl.pathname,
    method: request.method,
    reason
  });

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return addSecurityHeaders(
      NextResponse.json({ error: "No autorizado" }, { status: 401 }),
      request.nextUrl.pathname
    );
  }

  return addSecurityHeaders(
    NextResponse.redirect(buildLoginRedirect(request)),
    request.nextUrl.pathname
  );
}

function rejectForbidden(request: NextRequest, reason: string) {
  console.warn("[middleware] acceso rechazado", {
    path: request.nextUrl.pathname,
    method: request.method,
    reason
  });

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return addSecurityHeaders(
      NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
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
  const rateLimitResponse = await applyApiRateLimit(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (isPublicApi(pathname)) {
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  const needsAdmin = isAdminPage(pathname) || isAdminApi(pathname);
  const needsAuth = needsAdmin || requiresAuthenticatedWrite(request);

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"]
};
