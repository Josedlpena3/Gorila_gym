import Link from "next/link";
import { Dumbbell, ShieldCheck, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/forms/logout-button";

type SiteHeaderProps = {
  user: {
    firstName: string;
    role: string;
  } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neon text-ink">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-mist">Premium Fuel</p>
            <p className="text-xl font-black uppercase tracking-[0.12em] text-sand">
              Gorila Strong
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

        <div className="flex items-center gap-3">
          <Link href="/carrito" className="hidden sm:block">
            <Button variant="secondary" className="gap-2 px-4 py-2">
              <ShoppingBag className="h-4 w-4" />
              Carrito
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-sand">{user.firstName}</p>
                <Badge variant={user.role === "ADMIN" ? "success" : "default"}>
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
    </header>
  );
}

