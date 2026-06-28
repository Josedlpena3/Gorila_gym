"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackToCatalogLink() {
  const [href, setHref] = useState("/catalogo");
  const [label, setLabel] = useState("Volver al catálogo");

  useEffect(() => {
    try {
      const ref = document.referrer;
      if (!ref) return;
      const url = new URL(ref);
      // Only use the referrer if it comes from this same origin and from /catalogo
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== "/catalogo") return;

      if (url.search) {
        setHref(`/catalogo${url.search}`);
        const q = url.searchParams.get("q");
        if (q) {
          setLabel(`Volver a resultados de "${q}"`);
        }
      }
    } catch {
      // Invalid URL — keep defaults
    }
  }, []);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-mist transition hover:text-sand"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
