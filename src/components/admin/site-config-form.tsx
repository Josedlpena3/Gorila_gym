"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteConfigDto } from "@/types";

export function SiteConfigForm({
  initialConfig
}: {
  initialConfig: SiteConfigDto;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="section-card space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          setError(null);
          setSuccess(null);

          try {
            const response = await fetch("/api/admin/site-config", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(form)
            });
            const payload = (await response.json().catch(() => null)) as
              | (SiteConfigDto & { error?: string })
              | null;

            if (!response.ok || !payload) {
              setError(payload?.error ?? "No se pudo guardar la configuración.");
              return;
            }

            setForm({
              address: payload.address,
              googleMapsUrl: payload.googleMapsUrl,
              whatsappNumber: payload.whatsappNumber,
              whatsappMessage: payload.whatsappMessage
            });
            setSuccess("La información de Encontranos se actualizó correctamente.");
            router.refresh();
          } catch {
            setError("No se pudo guardar la configuración.");
          }
        });
      }}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Admin</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-sand">
          Encontranos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">
          Editá la dirección, el iframe de Google Maps y el CTA de WhatsApp que se
          muestran en la página pública.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm text-mist">Dirección</label>
          <Input
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-mist">Número de WhatsApp</label>
          <Input
            value={form.whatsappNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                whatsappNumber: event.target.value
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-mist">Mensaje de WhatsApp</label>
          <Input
            value={form.whatsappMessage}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                whatsappMessage: event.target.value
              }))
            }
            required
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm text-mist">URL de Google Maps</label>
          <Input
            type="url"
            value={form.googleMapsUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                googleMapsUrl: event.target.value
              }))
            }
            required
          />
          <p className="text-xs text-mist">
            Pegá solo la URL del `src` del embed de Google Maps.
          </p>
        </div>
      </div>
      <div className="rounded-[28px] border border-line bg-ink/60 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-mist">Publicación</p>
        <p className="mt-3 text-lg font-semibold text-sand">{form.address}</p>
        {form.googleMapsUrl.trim() ? (
          <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-steel/50">
            <iframe
              src={form.googleMapsUrl}
              title="Vista previa del mapa"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block min-h-[320px] w-full border-0"
            />
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-mist">
            La URL del mapa se valida al guardar y luego se publica en{" "}
            <span className="font-semibold text-sand">/encontranos</span>.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-neon">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
