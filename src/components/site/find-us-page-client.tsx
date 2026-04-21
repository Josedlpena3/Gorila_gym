"use client";

import { MapPin, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusCard } from "@/components/layout/status-card";
import type { SiteConfigDto } from "@/types";

export function FindUsPageClient() {
  const [siteConfig, setSiteConfig] = useState<SiteConfigDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSiteConfig() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/site-config", {
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => null)) as
        | (SiteConfigDto & {
            ok?: boolean;
            configured?: boolean;
            error?: string;
          })
        | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.error || "No se pudo cargar la información del local.");
      }

      if (
        typeof payload.address !== "string" ||
        typeof payload.googleMapsUrl !== "string" ||
        typeof payload.whatsappNumber !== "string" ||
        typeof payload.whatsappMessage !== "string" ||
        payload.address.trim().length === 0 ||
        payload.googleMapsUrl.trim().length === 0
      ) {
        throw new Error("La configuración del local todavía no está disponible.");
      }

      setSiteConfig({
        address: payload.address,
        googleMapsUrl: payload.googleMapsUrl,
        whatsappNumber: payload.whatsappNumber,
        whatsappMessage: payload.whatsappMessage
      });
    } catch (fetchError) {
      setSiteConfig(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudo cargar la información del local."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSiteConfig();
  }, []);

  const whatsappUrl = useMemo(() => {
    if (!siteConfig) {
      return null;
    }

    return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
      siteConfig.whatsappMessage
    )}`;
  }, [siteConfig]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-5xl p-4 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-mist">Encontranos</p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
            Cargando ubicación
          </h1>
          <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[0.95fr,1.05fr]">
            <div className="mx-auto flex w-full max-w-md flex-col gap-4 lg:mx-0 lg:max-w-none">
              <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
              <div className="h-24 animate-pulse rounded-[24px] bg-white/5" />
              <div className="h-[50px] w-full animate-pulse rounded-full bg-neon/20" />
            </div>
            <div className="h-[300px] animate-pulse rounded-[28px] border border-line bg-white/5 sm:h-[340px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!siteConfig || error) {
    return (
      <div className="page-shell">
        <StatusCard
          eyebrow="Encontranos"
          title="No se pudo cargar la información del local."
          description={
            error ??
            "La página sigue disponible, pero en este momento no pudimos recuperar la dirección y el mapa."
          }
          actions={[
            { href: "/encontranos", label: "Reintentar" },
            { href: "/catalogo", label: "Ir al catálogo", variant: "secondary" }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="section-card mx-auto max-w-5xl overflow-hidden p-4 sm:p-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[0.95fr,1.05fr] lg:items-start lg:gap-8">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:mx-0 lg:max-w-none">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-mist">Encontranos</p>
              <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
                Nuestro local
              </h1>
              <p className="mt-4 text-sm leading-7 text-mist sm:text-base">
                Coordiná tu visita o escribinos por WhatsApp para consultar stock,
                recomendaciones y horarios de atención.
              </p>
            </div>

            <div className="rounded-[28px] border border-line bg-ink/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl bg-neon/15 p-2 text-neon">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-mist">Dirección</p>
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
                rel="noreferrer"
                className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-neon px-5 py-3 text-base font-semibold text-ink transition hover:bg-neon/90"
              >
                <MessageCircle className="h-5 w-5" />
                Contactar por WhatsApp
              </a>
            ) : null}

            <button
              type="button"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-white/5 px-5 py-3 text-sm font-semibold text-sand transition hover:border-neon/60 hover:bg-white/10"
              onClick={() => {
                void loadSiteConfig();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar información
            </button>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-line bg-ink/60 shadow-premium">
            <iframe
              src={siteConfig.googleMapsUrl}
              title="Mapa del local Gorila Strong"
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
