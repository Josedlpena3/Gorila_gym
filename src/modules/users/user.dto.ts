import { Prisma } from "@prisma/client";

export const currentUserInclude = {
  role: true,
  addresses: {
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  }
} satisfies Prisma.UserInclude;

export const authUserInclude = {
  role: true
} satisfies Prisma.UserInclude;

export const adminUserListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  createdAt: true,
  role: {
    select: {
      key: true,
      label: true
    }
  },
  orders: {
    select: {
      id: true
    }
  }
} satisfies Prisma.UserSelect;

type CurrentUserRecord = Prisma.UserGetPayload<{
  include: typeof currentUserInclude;
}>;

type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

type AdminUserRecord = Prisma.UserGetPayload<{
  select: typeof adminUserListSelect;
}>;

export function mapCurrentUser(user: CurrentUserRecord) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role.key,
    roleLabel: user.role.label,
    addresses: user.addresses
  };
}

export function mapAuthenticatedUser(user: AuthUserRecord) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

export function mapAdminUser(user: AdminUserRecord) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    role: user.role,
    orders: user.orders
  };
}
