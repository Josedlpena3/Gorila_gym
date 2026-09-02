import Link from "next/link";
import { Compass, MapPin, ShoppingBag } from "lucide-react";

const DESTINOS = [
  {
    href: "/catalogo",
    icon: ShoppingBag,
    title: "Catálogo",
    description: "Todos los suplementos, filtrados por categoría."
  },
  {
    href: "/encontranos",
    icon: MapPin,
    title: "Encontranos",
    description: "Dirección del local y contacto directo."
  },
  {
    href: "/mis-pedidos",
    icon: Compass,
    title: "Mis pedidos",
    description: "Seguí el estado de lo que compraste."
  }
];

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl py-8 text-center sm:py-14">
        <p className="font-mono text-sm font-semibold text-ember">404</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-hero text-sand sm:text-5xl">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-mist sm:text-base">
          El enlace puede estar vencido o el producto ya no estar disponible.
          Estos son los lugares a los que probablemente querías llegar.
        </p>

        {/* Antes era una tarjeta suelta con un botón y media pantalla en negro
            debajo. Ahora ofrece salidas concretas. */}
        <div className="mt-9 grid gap-3 text-left sm:grid-cols-3">
          {DESTINOS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="card-interactive group p-4 sm:p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon/15 text-ember">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-sand group-hover:text-white">
                {title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-mist">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
