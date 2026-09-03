import Link from "next/link";
import { getFooterNavLinks } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline/70 py-10">
      <div className="page-shell">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-black uppercase tracking-eyebrow text-sand">Gorilla Strong</p>
            <p className="mt-2 text-sm text-mist">
              Suplementación premium para acompañar tu entrenamiento.
            </p>
            <a
              href="https://www.instagram.com/gorillastrong.va"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ember transition hover:underline"
            >
              @gorillastrong.va
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-mist">Tienda</p>
            <nav aria-label="Secciones de la tienda" className="mt-3 flex flex-col gap-2 text-sm">
              {getFooterNavLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[32px] items-center text-sand transition hover:text-ember"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-mist">Atención</p>
            <p className="mt-3 text-sm text-mist">
              Atención personalizada para coordinar entrega y seguimiento.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-hairline/50 pt-5 text-xs text-mist">
          © {new Date().getFullYear()} Gorilla Strong. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
