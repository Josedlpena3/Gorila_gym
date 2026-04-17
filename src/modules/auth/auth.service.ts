import { createHash, randomBytes } from "crypto";
import { RoleKey } from "@prisma/client";
import { comparePassword, hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
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

function getAppBaseUrl() {
  return env.appUrl || (env.nodeEnv === "production" ? "" : "http://localhost:3000");
}

function shouldExposeDevLink() {
  return env.nodeEnv !== "production";
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
      emailError = result.error;
    }
  } else {
    emailError = "NEXT_PUBLIC_APP_URL no está configurada para construir el enlace.";
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
  await ensureBaseRoles();

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: authUserInclude
  });

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const isValidPassword = await comparePassword(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Credenciales inválidas", 401);
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

  if (
    !verificationToken ||
    verificationToken.usedAt ||
    verificationToken.expiresAt < new Date()
  ) {
    throw new AppError("El enlace de verificación es inválido o expiró", 400);
  }

  if (verificationToken.user.emailVerified) {
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: {
        usedAt: new Date()
      }
    });

    return {
      message: "Tu email ya estaba verificado."
    };
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
    message: "Tu email fue verificado correctamente."
  };
}

export async function requestPasswordReset(input: unknown) {
  const data = forgotPasswordSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
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
  let emailError: string | null = null;

  if (resetUrl) {
    const result = await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetUrl,
      expiresAt
    });

    if (!result.ok) {
      emailError = result.error;
    }
  } else {
    emailError = "NEXT_PUBLIC_APP_URL no está configurada para construir el enlace.";
  }

  return {
    message:
      "Si el email existe, vas a recibir instrucciones para recuperar tu contraseña.",
    resetLink: shouldExposeDevLink() ? resetUrl || null : null,
    emailError
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
