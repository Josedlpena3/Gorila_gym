import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { SessionProvider } from "@/components/auth/session-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// next/font autohospeda la fuente, la sirve desde el mismo dominio y aplica
// size-adjust sobre el fallback, así que no introduce salto de layout.
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Gorilla Strong",
  description:
    "Tienda virtual de suplementos premium con catálogo, carrito, checkout y panel administrativo."
};

// El layout es un componente servidor sin lecturas de cookies: es lo que
// permite que las páginas públicas se prerendericen en vez de recalcularse en
// cada request. El estado de sesión lo resuelve SessionProvider en el cliente.
export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" className={figtree.variable}>
      <body>
        <SessionProvider>
          <SiteHeader />
          <EmailVerificationBanner />
          <main className="min-h-[calc(100vh-160px)] py-10">{children}</main>
          <SiteFooter />
          <Toaster position="bottom-center" theme="dark" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
