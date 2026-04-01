import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { RoleKey } from "@prisma/client";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  firstName: string;
  role: RoleKey;
};

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
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifySessionToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
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
