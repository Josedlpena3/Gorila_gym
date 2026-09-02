import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { SessionProvider } from "@/components/auth/session-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { env } from "@/lib/env";

// next/font autohospeda la fuente, la sirve desde el mismo dominio y aplica
// size-adjust sobre el fallback, así que no introduce salto de layout.
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  // Sin metadataBase, las imágenes de Open Graph de las fichas de producto se
  // resolvían como rutas relativas y WhatsApp no mostraba vista previa al
  // compartir un producto.
  metadataBase: new URL(env.appUrl || "https://gorila-strong.vercel.app"),
  title: {
    default: "Gorilla Strong",
    template: "%s | Gorilla Strong"
  },
  description:
    "Suplementos deportivos con asesoramiento personalizado. Proteínas, creatinas, pre entrenos y más, con envío a Villa Allende y zona.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Gorilla Strong"
  }
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
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-neon focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
          >
            Saltar al contenido
          </a>
          <SiteHeader />
          <EmailVerificationBanner />
          <main id="contenido" tabIndex={-1} className="min-h-[calc(100dvh-160px)] py-10 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <Toaster position="bottom-center" theme="dark" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
