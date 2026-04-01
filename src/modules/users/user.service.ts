import { RoleKey } from "@prisma/client";
import { getSessionPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  adminUserListSelect,
  currentUserInclude,
  mapAdminUser,
  mapCurrentUser
} from "@/modules/users/user.dto";
import { profileSchema } from "@/modules/users/user.schemas";

export async function getCurrentUser() {
  const session = getSessionPayload();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: currentUserInclude
  });

  if (!user) {
    return null;
  }

  return mapCurrentUser(user);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Debes iniciar sesión para continuar", 401);
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (user.role !== RoleKey.ADMIN) {
    throw new AppError("No tenés permisos para esta acción", 403);
  }

  return user;
}

export async function updateCurrentUserProfile(userId: string, input: unknown) {
  const data = profileSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      }
    });

    if (data.address) {
      const existingDefaultAddress = await tx.address.findFirst({
        where: {
          userId,
          isDefault: true
        }
      });

      if (existingDefaultAddress) {
        await tx.address.update({
          where: { id: existingDefaultAddress.id },
          data: {
            ...data.address,
            isDefault: true
          }
        });
      } else {
        await tx.address.create({
          data: {
            userId,
            ...data.address,
            isDefault: true
          }
        });
      }
    }

    return updatedUser;
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: adminUserListSelect,
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map(mapAdminUser);
}
