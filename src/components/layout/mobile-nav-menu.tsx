"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/forms/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MobileNavMenuProps = {
  user: {
    firstName: string;
    role: string;
  } | null;
};

export function MobileNavMenu({ user }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative lg:hidden">
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white/5 text-sand transition hover:border-neon/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon/60"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={isOpen ? "Cerrar menú principal" : "Abrir menú principal"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-30 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-[28px] border border-line bg-ink/95 p-4 shadow-premium backdrop-blur">
            {user ? (
              <div className="border-b border-line pb-4">
                <p className="text-sm font-semibold text-sand">{user.firstName}</p>
                <div className="mt-2">
                  <Badge variant={user.role === "ADMIN" ? "success" : "info"}>
                    {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                  </Badge>
                </div>
              </div>
            ) : null}

            <nav className="mt-4 space-y-1 text-sm font-semibold text-sand">
              <Link
                href="/catalogo"
                className="block rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-neon"
                onClick={() => setIsOpen(false)}
              >
                Catálogo
              </Link>
              <Link
                href="/carrito"
                className="block rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-neon"
                onClick={() => setIsOpen(false)}
              >
                Carrito
              </Link>
              <Link
                href="/mis-pedidos"
                className="block rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-neon"
                onClick={() => setIsOpen(false)}
              >
                Mis pedidos
              </Link>
              {user?.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-neon"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
            </nav>

            {user ? (
              <div className="mt-4 border-t border-line pt-4">
                <LogoutButton className="w-full justify-center rounded-2xl" />
              </div>
            ) : (
              <div className="mt-4 grid gap-2 border-t border-line pt-4">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full rounded-2xl">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-2xl">Crear cuenta</Button>
                </Link>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
