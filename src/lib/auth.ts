import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { RoleKey } from "@prisma/client";
import { AUTH_COOKIE_NAME, VALID_AUTH_ROLES } from "@/lib/auth-constants";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  firstName: string;
  role: RoleKey;
};

const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new AppError("JWT_SECRET no está configurado", 500);
  }

  return env.jwtSecret;
}

export function createSessionToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    algorithm: "HS256"
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifySessionToken(token: string) {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"]
    }) as AuthTokenPayload;

    if (
      typeof payload.sub !== "string" ||
      payload.sub.trim().length === 0 ||
      !VALID_AUTH_ROLES.includes(payload.role)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getSessionCookieMaxAge(token: string) {
  const decoded = jwt.decode(token) as JwtPayload | null;

  if (typeof decoded?.exp === "number") {
    return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
  }

  return DEFAULT_SESSION_MAX_AGE;
}

export function setSessionCookie(token: string) {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAge(token)
  });
}

export function clearSessionCookie() {
  cookies().set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getSessionPayload() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
