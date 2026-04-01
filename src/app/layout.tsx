import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/modules/users/user.service";

export const metadata: Metadata = {
  title: "Gorila Strong",
  description:
    "Tienda virtual de suplementos premium con catálogo, carrito, checkout y panel administrativo."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        <SiteHeader
          user={user ? { firstName: user.firstName, role: user.role } : null}
        />
        <main className="min-h-[calc(100vh-160px)] py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
