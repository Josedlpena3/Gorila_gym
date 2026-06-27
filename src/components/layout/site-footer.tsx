import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 py-10">
      <div className="page-shell">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-black uppercase tracking-[0.14em] text-sand">Gorilla Strong</p>
            <p className="mt-2 text-sm text-mist">
              Suplementación premium para acompañar tu entrenamiento.
            </p>
            <a
              href="https://www.instagram.com/gorillastrong.va"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-neon transition hover:text-neon/75"
            >
              @gorillastrong.va
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Tienda</p>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/catalogo" className="text-sand transition hover:text-neon">
                Catálogo
              </Link>
              <Link href="/carrito" className="text-sand transition hover:text-neon">
                Carrito
              </Link>
              <Link href="/mis-pedidos" className="text-sand transition hover:text-neon">
                Mis pedidos
              </Link>
              <Link href="/encontranos" className="text-sand transition hover:text-neon">
                Encontranos
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Atención</p>
            <p className="mt-3 text-sm text-mist">
              Atención personalizada para coordinar entrega y seguimiento.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-line/50 pt-5 text-xs text-mist">
          © {new Date().getFullYear()} Gorilla Strong. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
