import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppError } from "@/lib/errors";
import { requireAdminUser } from "@/modules/users/user.service";

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  try {
    await requireAdminUser();
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect("/login?next=/admin");
    }

    throw error;
  }

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[260px,1fr]">
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
