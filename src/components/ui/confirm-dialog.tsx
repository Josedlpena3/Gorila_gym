"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/use-focus-trap";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmación de una acción destructiva.
 *
 * Reemplaza a `window.confirm()`, que bloquea el hilo principal, no se puede
 * estilar y en móvil aparece como un cartel del navegador desconectado de la
 * aplicación. Este diálogo atrapa el foco, cierra con Escape y describe la
 * acción con el mismo lenguaje que el resto del sitio.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isPending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancelar"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-[28px] border border-hairline bg-ink p-6 shadow-premium"
      >
        <h2
          id={titleId}
          className="text-xl font-black uppercase tracking-display text-sand"
        >
          {title}
        </h2>

        {description ? (
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-mist">
            {description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
            className="sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            className="sm:w-auto"
          >
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
