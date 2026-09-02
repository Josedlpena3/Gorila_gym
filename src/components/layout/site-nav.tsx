"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";
import { getVisibleNavLinks, isActiveNavLink } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Navegación principal del header en escritorio.
 *
 * Es cliente por dos motivos: el enlace al panel depende del rol, y `aria-current`
 * necesita conocer la ruta actual. Sin `aria-current`, un lector de pantalla
 * lee cinco enlaces iguales sin decir en cuál está parado el usuario.
 */
export function SiteNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const links = getVisibleNavLinks(user?.role === "ADMIN");

  return (
    <nav
      aria-label="Navegación principal"
      className="hidden shrink-0 items-center gap-3 text-sm text-mist md:flex lg:gap-6"
    >
      {links.map((link) => {
        const isActive = isActiveNavLink(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap transition hover:text-sand",
              isActive && "font-semibold text-sand"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
