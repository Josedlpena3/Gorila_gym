"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/promociones", label: "Promociones" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="section-card h-fit p-4">
      <p className="px-3 py-2 text-xs uppercase tracking-[0.28em] text-mist">
        Administración
      </p>
      <nav className="mt-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-2xl px-4 py-3 text-sm font-medium text-mist transition hover:bg-white/5 hover:text-sand",
              pathname === link.href && "bg-neon text-ink hover:bg-neon"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
