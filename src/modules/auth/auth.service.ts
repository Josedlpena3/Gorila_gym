import { createHash, randomBytes } from "crypto";
import { RoleKey } from "@prisma/client";
import { comparePassword, hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "@/modules/auth/auth.schemas";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail
} from "@/modules/notifications/notification.service";
import {
  authUserInclude,
  mapAuthenticatedUser
} from "@/modules/users/user.dto";

const PASSWORD_RESET_TOKEN_MINUTES = 30;
const EMAIL_VERIFICATION_TOKEN_HOURS = 24;
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;
const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AUTH_RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION_MS = 5 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  "$2b$12$DnECzMyCk0MCle2p1lUDwOoRUOY/u4K6p50H9SJRx4tffJLU/3uw.";

async function ensureBaseRoles() {
  await Promise.all([
    prisma.role.upsert({
      where: { key: RoleKey.CUSTOMER },
      update: { label: "Cliente" },
      create: { key: RoleKey.CUSTOMER, label: "Cliente" }
    }),
    prisma.role.upsert({
      where: { key: RoleKey.ADMIN },
      update: { label: "Administrador" },
      create: { key: RoleKey.ADMIN, label: "Administrador" }
    })
  ]);
}

function hashOneTimeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
  return randomBytes(32).toString("hex");
}

async function assertSensitiveAuthRateLimit(action: "login" | "forgot-password", email: string) {
  const result = await consumeRateLimit({
    key: email,
    prefix: `auth:${action}`,
    limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS
  });

  if (result.limited) {
    console.warn("[auth] rate limit", {
      action,
      reason: "email_rate_limited"
    });
    throw new AppError(
      action === "login"
        ? "Demasiados intentos, intentá más tarde"
        : "Demasiadas solicitudes",
      429,
      {
        retryAfterSeconds: result.retryAfterSeconds
      }
    );
  }
}

async function assertPasswordResetCooldown(email: string) {
  const now = new Date();
  const request = await prisma.passwordResetRequest.findUnique({
    where: { email },
    select: {
      lastRequestedAt: true
    }
  });

  if (
    request &&
    now.getTime() - request.lastRequestedAt.getTime() < PASSWORD_RESET_COOLDOWN_MS
  ) {
    throw new AppError("Esperá unos segundos antes de volver a intentarlo", 429);
  }

  await prisma.passwordResetRequest.upsert({
    where: { email },
    update: {
      lastRequestedAt: now
    },
    create: {
      email,
      lastRequestedAt: now
    }
  });
}

function getAppBaseUrl() {
  return env.appUrl;
}

function shouldExposeDevLink() {
  return env.nodeEnv !== "production";
}

function getSafeEmailErrorMessage(message: string) {
  return shouldExposeDevLink()
    ? message
    : "No se pudo enviar el correo en este momento.";
}

function buildVerificationUrl(token: string) {
  const baseUrl = getAppBaseUrl();
  return baseUrl ? `${baseUrl}/verificar-email?token=${token}` : "";
}

function buildResetUrl(token: string) {
  const baseUrl = getAppBaseUrl();
  return baseUrl ? `${baseUrl}/restablecer-password?token=${token}` : "";
}

async function createEmailVerificationToken(userId: string) {
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });

  const rawToken = createRawToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * EMAIL_VERIFICATION_TOKEN_HOURS);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashOneTimeToken(rawToken),
      expiresAt
    }
  });

  return {
    rawToken,
    expiresAt
  };
}

async function sendVerificationEmailToUser(input: {
  userId: string;
  email: string;
  firstName: string;
}) {
  const { rawToken, expiresAt } = await createEmailVerificationToken(input.userId);
  const verificationUrl = buildVerificationUrl(rawToken);
  let emailError: string | null = null;

  if (verificationUrl) {
    const result = await sendEmailVerificationEmail({
      email: input.email,
      firstName: input.firstName,
      verificationUrl,
      expiresAt
    });

    if (!result.ok) {
      emailError = getSafeEmailErrorMessage(result.error);
    }
  } else {
    emailError = getSafeEmailErrorMessage(
      "NEXT_PUBLIC_APP_URL no está configurada para construir el enlace."
    );
  }

  return {
    verificationLink: shouldExposeDevLink() ? verificationUrl || null : null,
    expiresAt,
    emailError
  };
}

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);
  await ensureBaseRoles();

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (existingUser) {
    throw new AppError("Ya existe un usuario con ese email", 409);
  }

  const customerRole = await prisma.role.findUnique({
    where: { key: RoleKey.CUSTOMER }
  });

  if (!customerRole) {
    throw new AppError("No se pudo inicializar el rol cliente", 500);
  }

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: await hashPassword(data.password),
      roleId: customerRole.id,
      emailVerified: false,
      emailVerifiedAt: null,
      cart: {
        create: {}
      }
    },
    include: authUserInclude
  });

  const verification = await sendVerificationEmailToUser({
    userId: user.id,
    email: user.email,
    firstName: user.firstName
  });

  return {
    user: mapAuthenticatedUser(user),
    ...verification
  };
}

export async function loginUser(input: unknown) {
  const data = loginSchema.parse(input);
  const normalizedEmail = data.email.toLowerCase().trim();
  const now = new Date();

  await assertSensitiveAuthRateLimit("login", normalizedEmail);
  await ensureBaseRoles();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: authUserInclude
  });

  if (!user) {
    await comparePassword(data.password, DUMMY_PASSWORD_HASH);
    console.warn("[auth] login fallido", {
      reason: "invalid_credentials"
    });
    throw new AppError("Credenciales inválidas", 401);
  }

  if (user.loginBlockedUntil && user.loginBlockedUntil > now) {
    console.warn("[auth] login bloqueado", {
      reason: "user_temporarily_blocked"
    });
    throw new AppError("Demasiados intentos, intentá más tarde", 429, {
      retryAfterSeconds: Math.max(
        Math.ceil((user.loginBlockedUntil.getTime() - now.getTime()) / 1000),
        1
      )
    });
  }

  const currentFailedAttempts =
    user.loginBlockedUntil && user.loginBlockedUntil <= now
      ? 0
      : user.failedLoginAttempts;

  const isValidPassword = await comparePassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    const nextFailedAttempts = currentFailedAttempts + 1;
    const shouldBlock = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    const blockedUntil = shouldBlock
      ? new Date(now.getTime() + LOGIN_BLOCK_DURATION_MS)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lastFailedLoginAt: now,
        loginBlockedUntil: blockedUntil
      }
    });

    console.warn("[auth] login fallido", {
      reason: shouldBlock ? "user_blocked" : "invalid_password"
    });

    if (shouldBlock && blockedUntil) {
      throw new AppError("Demasiados intentos, intentá más tarde", 429, {
        retryAfterSeconds: Math.max(
          Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
          1
        )
      });
    }

    throw new AppError("Credenciales inválidas", 401);
  }

  if (
    currentFailedAttempts > 0 ||
    user.lastFailedLoginAt ||
    user.loginBlockedUntil
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        loginBlockedUntil: null
      }
    });
  }

  return mapAuthenticatedUser(user);
}

export async function resendEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      emailVerified: true
    }
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (user.emailVerified) {
    return {
      message: "Tu email ya está verificado.",
      verificationLink: null as string | null
    };
  }

  const verification = await sendVerificationEmailToUser({
    userId: user.id,
    email: user.email,
    firstName: user.firstName
  });

  return {
    message: verification.emailError
      ? "No se pudo enviar el correo de verificación. Revisá la configuración SMTP y probá de nuevo."
      : "Te enviamos un nuevo enlace para verificar tu email.",
    verificationLink: verification.verificationLink,
    emailError: verification.emailError
  };
}

export async function verifyEmailByToken(token: string) {
  const normalizedToken = token.trim();

  if (normalizedToken.length < 20) {
    throw new AppError("El enlace de verificación es inválido o expiró", 400);
  }

  const tokenHash = hashOneTimeToken(normalizedToken);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          emailVerified: true
        }
      }
    }
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    throw new AppError("El enlace de verificación es inválido o expiró", 400);
  }

  if (verificationToken.user.emailVerified) {
    if (!verificationToken.usedAt) {
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          usedAt: new Date()
        }
      });
    }

    return {
      status: "already_verified" as const,
      message: "Tu email ya estaba verificado."
    };
  }

  if (verificationToken.usedAt) {
    throw new AppError("El enlace de verificación es inválido o expiró", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: {
        usedAt: new Date()
      }
    }),
    prisma.emailVerificationToken.updateMany({
      where: {
        userId: verificationToken.user.id,
        id: {
          not: verificationToken.id
        },
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    })
  ]);

  return {
    status: "verified" as const,
    message: "Tu email fue verificado correctamente."
  };
}

export async function requestPasswordReset(input: unknown) {
  const data = forgotPasswordSchema.parse(input);
  const normalizedEmail = data.email.toLowerCase().trim();

  await assertSensitiveAuthRateLimit("forgot-password", normalizedEmail);
  await assertPasswordResetCooldown(normalizedEmail);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    return {
      message:
        "Si el email existe, vas a recibir instrucciones para recuperar tu contraseña."
    };
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });

  const rawToken = createRawToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * PASSWORD_RESET_TOKEN_MINUTES);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashOneTimeToken(rawToken),
      expiresAt
    }
  });

  const resetUrl = buildResetUrl(rawToken);

  if (resetUrl) {
    const result = await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetUrl,
      expiresAt
    });

    if (!result.ok) {
      console.warn("[auth] no se pudo enviar el email de recuperación", {
        reason: "email_send_failed"
      });
    }
  } else {
    console.warn("[auth] no se pudo construir el enlace de recuperación", {
      reason: "missing_app_url"
    });
  }

  return {
    message:
      "Si el email existe, vas a recibir instrucciones para recuperar tu contraseña.",
    resetLink: shouldExposeDevLink() && resetUrl ? resetUrl : null
  };
}

export async function resetPasswordByToken(input: unknown) {
  const data = resetPasswordSchema.parse(input);
  const tokenHash = hashOneTimeToken(data.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: true
    }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError("El token de recuperación es inválido o expiró", 400);
  }

  const newHash = await hashPassword(data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  return {
    message: "La contraseña fue actualizada correctamente."
  };
}

export async function changePasswordForUser(userId: string, input: unknown) {
  const data = changePasswordSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  const currentPasswordIsValid = await comparePassword(
    data.currentPassword,
    user.passwordHash
  );

  if (!currentPasswordIsValid) {
    throw new AppError("La contraseña actual no es correcta", 400);
  }

  const newPasswordMatchesCurrent = await comparePassword(
    data.newPassword,
    user.passwordHash
  );

  if (newPasswordMatchesCurrent) {
    throw new AppError(
      "La nueva contraseña no puede ser igual a la actual",
      400
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(data.newPassword)
      }
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    })
  ]);

  return {
    message: "La contraseña fue actualizada correctamente."
  };
}
