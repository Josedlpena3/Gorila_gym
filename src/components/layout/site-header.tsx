import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/forms/logout-button";
import { MobileNavMenu } from "@/components/layout/mobile-nav-menu";

type SiteHeaderProps = {
  user: {
    firstName: string;
    role: string;
  } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-12 sm:w-12">
            <Image
              src="/branding/logo-gorila.png"
              alt="Gorila Strong"
              width={1024}
              height={1024}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-sand sm:text-xs sm:tracking-[0.24em]">
              Gorila Strong
            </p>
            <p className="truncate text-[9px] uppercase tracking-[0.24em] text-mist sm:text-[10px] sm:tracking-[0.3em]">
              Suplementacion premium
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-mist lg:flex">
          <Link href="/catalogo" className="hover:text-sand">
            Catálogo
          </Link>
          <Link href="/carrito" className="hover:text-sand">
            Carrito
          </Link>
          <Link href="/mis-pedidos" className="hover:text-sand">
            Mis pedidos
          </Link>
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="hover:text-sand">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <MobileNavMenu user={user} />

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/carrito">
              <Button variant="secondary" className="gap-2 px-4 py-2">
                <ShoppingBag className="h-4 w-4" />
                Carrito
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/mi-cuenta"
                  className="hidden text-right transition hover:text-neon sm:block"
                >
                  <p className="text-sm font-semibold text-sand">Mi cuenta</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-mist">Ver perfil</p>
                </Link>
                <div className="hidden sm:block">
                  <Badge variant={user.role === "ADMIN" ? "success" : "info"}>
                    {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                  </Badge>
                </div>
                {user.role === "ADMIN" ? (
                  <Link href="/admin">
                    <Button variant="secondary" className="gap-2 px-4 py-2">
                      <ShieldCheck className="h-4 w-4" />
                      Panel
                    </Button>
                  </Link>
                ) : null}
                <LogoutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="px-4 py-2">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button className="px-4 py-2">Crear cuenta</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
