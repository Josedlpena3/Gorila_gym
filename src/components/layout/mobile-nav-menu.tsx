"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";
import { getVisibleNavLinks, isActiveNavLink } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { LogoutButton } from "@/components/forms/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MobileNavMenu() {
  const { user } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

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
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-hairline bg-white/5 text-sand transition hover:border-neon/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon/60"
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
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="absolute right-0 top-full z-30 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[28px] border border-hairline bg-ink/95 p-4 shadow-premium backdrop-blur"
          >
            {user ? (
              <div className="border-b border-hairline pb-4">
                <Link
                  href="/mi-cuenta"
                  className="block rounded-2xl transition hover:text-ember"
                  onClick={() => setIsOpen(false)}
                >
                  <p className="text-sm font-semibold text-sand">Mi cuenta</p>
                  <p className="mt-1 text-xs uppercase tracking-eyebrow text-mist">
                    Ver perfil
                  </p>
                </Link>
                <div className="mt-2">
                  <Badge variant={user.role === "ADMIN" ? "success" : "info"}>
                    {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                  </Badge>
                </div>
              </div>
            ) : null}

            <nav
              aria-label="Navegación principal"
              className="mt-4 space-y-1 text-sm font-semibold text-sand"
            >
              {getVisibleNavLinks(user?.role === "ADMIN").map((link) => {
                const isActive = isActiveNavLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-ember",
                      isActive && "bg-white/5 text-ember"
                    )}
                  >
                    {link.adminOnly ? <ShieldCheck className="h-4 w-4" /> : null}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {user ? (
              <div className="mt-4 border-t border-hairline pt-4">
                <LogoutButton className="w-full justify-center rounded-2xl" />
              </div>
            ) : (
              <div className="mt-4 grid gap-2 border-t border-hairline pt-4">
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
