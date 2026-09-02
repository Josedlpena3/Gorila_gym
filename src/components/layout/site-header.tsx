import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderAuth } from "@/components/layout/header-auth";
import { MobileNavMenu } from "@/components/layout/mobile-nav-menu";
import { SiteNav } from "@/components/layout/site-nav";

/**
 * El header es estático a propósito: el estado de sesión lo resuelven
 * `HeaderAuth` y `MobileNavMenu` en el cliente. Así el layout raíz no lee
 * cookies y las páginas públicas pueden prerenderizarse.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-12 sm:w-12">
            <Image
              src="/branding/logo-gorila.png"
              alt="Gorilla Strong"
              width={96}
              height={96}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[10px] font-black uppercase tracking-eyebrow text-sand sm:text-xs sm:tracking-eyebrow">
              Gorilla Strong
            </p>
            <p className="truncate text-[9px] uppercase tracking-eyebrow text-mist sm:text-[10px] sm:tracking-eyebrow-wide">
              Suplementacion premium
            </p>
          </div>
        </Link>

        <SiteNav />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/carrito"
            aria-label="Ir al carrito"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white/5 text-sand transition hover:border-neon/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon/60 lg:hidden"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <MobileNavMenu />

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/carrito">
              <Button variant="secondary" className="gap-2 px-4 py-2">
                <ShoppingBag className="h-4 w-4" />
                Carrito
              </Button>
            </Link>

            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}
