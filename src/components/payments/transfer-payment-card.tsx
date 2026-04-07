"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BankTransferDetailsDto } from "@/types";

type TransferPaymentCardProps = {
  transfer: BankTransferDetailsDto;
  className?: string;
  showAccountDetails?: boolean;
};

function isImageProof(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function TransferPaymentCard({
  transfer,
  className = "",
  showAccountDetails = true
}: TransferPaymentCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleCopy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1800);
    } catch {
      setCopiedField(null);
    }
  }

  return (
    <div className={`rounded-[28px] border border-line bg-ink/60 p-5 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-mist">
            Transferencia bancaria
          </p>
          <p className="mt-2 text-xl font-semibold text-sand">
            Referencia {transfer.reference}
          </p>
          <p className="mt-1 text-sm text-mist">
            Monto a transferir:{" "}
            <span className="font-semibold text-sand">
              {formatCurrency(transfer.amount)}
            </span>
          </p>
        </div>
        {transfer.expiresAt ? (
          <p className="text-sm text-mist">
            Vence el{" "}
            <span className="font-semibold text-sand">
              {formatDate(transfer.expiresAt)}
            </span>
          </p>
        ) : null}
      </div>

      {showAccountDetails ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-ink/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-mist">Alias</p>
            <div className="mt-3 flex items-center gap-2">
              <Input value={transfer.alias} readOnly className="font-semibold" />
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-3"
                onClick={() => void handleCopy(transfer.alias, "alias")}
              >
                {copiedField === "alias" ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-ink/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-mist">CVU</p>
            <div className="mt-3 flex items-center gap-2">
              <Input value={transfer.cbu} readOnly className="font-semibold" />
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-3"
                onClick={() => void handleCopy(transfer.cbu, "cbu")}
              >
                {copiedField === "cbu" ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-ink/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-mist">Titular</p>
            <p className="mt-3 font-semibold text-sand">{transfer.accountHolder}</p>
            {transfer.bankName ? (
              <p className="mt-2 text-sm text-mist">{transfer.bankName}</p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-line bg-ink/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-mist">Estado</p>
            <p className="mt-3 text-sm text-mist">
              Enviá la transferencia con la referencia del pedido y adjuntá el comprobante
              antes de confirmar la compra.
            </p>
            {transfer.instructions ? (
              <p className="mt-3 text-sm text-mist">{transfer.instructions}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-line bg-ink/70 p-4 text-sm text-mist">
          <p className="font-semibold text-sand">Comprobante del cliente</p>
          <p className="mt-2">
            En esta vista sólo se muestran la referencia, el monto y el comprobante
            cargado por el cliente.
          </p>
        </div>
      )}

      {transfer.receipt ? (
        <div className="mt-5 rounded-3xl border border-line bg-ink/70 p-4">
          <p className="text-sm font-semibold text-sand">Comprobante adjunto</p>
          <p className="mt-2 text-sm text-mist">
            {transfer.receipt.fileName} · {Math.round(transfer.receipt.size / 1024)} KB
          </p>
          <p className="mt-1 text-xs text-mist">
            Subido el {formatDate(transfer.receipt.uploadedAt)}
          </p>
          {isImageProof(transfer.receipt.mimeType) ? (
            <div className="relative mt-4 h-56 overflow-hidden rounded-3xl border border-line">
              <Image
                src={transfer.receipt.url}
                alt="Comprobante de transferencia"
                fill
                className="object-cover"
              />
            </div>
          ) : null}
          <a
            href={transfer.receipt.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-neon transition hover:text-neon/80"
          >
            Abrir comprobante
          </a>
        </div>
      ) : null}
    </div>
  );
}
