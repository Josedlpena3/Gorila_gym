import { createHash, randomBytes } from "crypto";
import { RoleKey } from "@prisma/client";
import { comparePassword, hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "@/modules/auth/auth.schemas";
import {
  authUserInclude,
  mapAuthenticatedUser
} from "@/modules/users/user.dto";
import { sendPasswordResetEmail } from "@/modules/notifications/notification.service";

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

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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
      cart: {
        create: {}
      }
    },
    include: authUserInclude
  });

  return mapAuthenticatedUser(user);
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

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt
    }
  });

  if (env.appUrl) {
    const resetUrl = `${env.appUrl}/restablecer-password?token=${rawToken}`;

    void sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetUrl,
      expiresAt
    }).catch((error) => {
      console.error("No se pudo enviar el mail de recuperación", error);
    });
  }

  return {
    message:
      "Si el email existe, vas a recibir instrucciones para recuperar tu contraseña."
  };
}

export async function resetPasswordByToken(input: unknown) {
  const data = resetPasswordSchema.parse(input);
  const tokenHash = hashResetToken(data.token);

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
