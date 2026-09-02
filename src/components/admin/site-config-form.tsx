"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { Field, FormError, FormStatus } from "@/components/ui/field";
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
            const payload = await api.put<SiteConfigDto>(
              "/api/admin/site-config",
              form,
              { fallbackMessage: "No se pudo guardar la configuración." }
            );

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
        <p className="text-sm uppercase tracking-eyebrow-wide text-mist">Admin</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-display text-sand">
          Encontranos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">
          Editá la dirección, el iframe de Google Maps y el CTA de WhatsApp que se
          muestran en la página pública.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Dirección" className="lg:col-span-2">
          {(control) => (
            <Input
              {...control}
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              required
            />
          )}
        </Field>

        <Field label="Número de WhatsApp">
          {(control) => (
            <Input
              {...control}
              value={form.whatsappNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  whatsappNumber: event.target.value
                }))
              }
              required
            />
          )}
        </Field>

        <Field label="Mensaje de WhatsApp">
          {(control) => (
            <Input
              {...control}
              value={form.whatsappMessage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  whatsappMessage: event.target.value
                }))
              }
              required
            />
          )}
        </Field>

        <Field
          label="URL de Google Maps"
          className="lg:col-span-2"
          hint="Pegá solo la URL del `src` del embed de Google Maps."
        >
          {(control) => (
            <Input
              {...control}
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
          )}
        </Field>
      </div>
      <div className="rounded-[28px] border border-line bg-ink/60 p-5">
        <p className="text-xs uppercase tracking-eyebrow text-mist">Publicación</p>
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

      <FormError>{error}</FormError>
      <FormStatus className="text-ember">{success}</FormStatus>

      <div className="flex flex-wrap gap-3">
        <Button disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
