import type { Metadata } from "next";
import { MapPin, MessageCircle } from "lucide-react";
import { StatusCard } from "@/components/layout/status-card";
import { getSiteConfig } from "@/modules/site-config/site-config.service";

// La dirección y el WhatsApp casi nunca cambian: se cachean una hora y el
// panel de administración invalida la página al guardar.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Encontranos",
  description:
    "Ubicación del local, mapa y contacto directo por WhatsApp de Gorilla Strong."
};

/**
 * Antes esta página era un componente servidor cuyo único trabajo era renderizar
 * un componente cliente que pedía `/api/site-config` en un useEffect. La cascada
 * era HTML -> descarga del JS -> hidratación -> fetch -> render, para un dato
 * público que no cambia. Ahora viene resuelto en el HTML inicial y la página no
 * envía JavaScript propio.
 */
export default async function FindUsPage() {
  const siteConfig = await getSiteConfig().catch((error) => {
    console.error("[encontranos] no se pudo cargar la configuración", error);
    return null;
  });

  if (!siteConfig?.address || !siteConfig.googleMapsUrl) {
    return (
      <div className="page-shell">
        <StatusCard
          eyebrow="Encontranos"
          title="No pudimos cargar la información del local."
          description="La página sigue disponible, pero en este momento no tenemos la dirección y el mapa. Probá de nuevo en un rato o escribinos por Instagram."
          actions={[
            { href: "/encontranos", label: "Reintentar" },
            { href: "/catalogo", label: "Ir al catálogo", variant: "secondary" }
          ]}
        />
      </div>
    );
  }

  const whatsappUrl = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
        siteConfig.whatsappMessage
      )}`
    : null;

  return (
    <div className="page-shell">
      <section className="section-card mx-auto max-w-5xl overflow-hidden p-4 sm:p-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[0.95fr,1.05fr] lg:items-start lg:gap-8">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:mx-0 lg:max-w-none">
            <div>
              <p className="text-xs uppercase tracking-eyebrow-wide text-mist">
                Encontranos
              </p>
              <h1 className="mt-3 text-2xl font-black uppercase tracking-display text-sand sm:text-4xl">
                Nuestro local
              </h1>
              <p className="mt-4 text-sm leading-7 text-mist sm:text-base">
                Coordiná tu visita o escribinos por WhatsApp para consultar stock,
                recomendaciones y horarios de atención.
              </p>
              <p className="mt-2 text-sm leading-7 text-mist sm:text-base">
                Seguinos en Instagram:{" "}
                <a
                  href="https://www.instagram.com/gorillastrong.va"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ember transition hover:underline"
                >
                  @gorillastrong.va
                </a>
              </p>
            </div>

            <div className="rounded-[28px] border border-hairline bg-surface-sunken p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl bg-neon/15 p-2 text-ember">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-eyebrow text-mist">
                    Dirección
                  </p>
                  <p className="mt-2 text-lg font-semibold text-sand">
                    {siteConfig.address}
                  </p>
                </div>
              </div>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-base font-semibold text-white transition hover:bg-neon/90"
              >
                <MessageCircle className="h-5 w-5" />
                Contactar por WhatsApp
              </a>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[28px] border border-hairline bg-surface-sunken shadow-premium">
            <iframe
              src={siteConfig.googleMapsUrl}
              title="Mapa del local Gorilla Strong"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[300px] w-full rounded-xl border-0 sm:h-[360px]"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
