export const AUTH_COOKIE_NAME = "gorila_strong_session";

export const VALID_AUTH_ROLES = ["ADMIN", "CUSTOMER"] as const;

export type ValidAuthRole = (typeof VALID_AUTH_ROLES)[number];
