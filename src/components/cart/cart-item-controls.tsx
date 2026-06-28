"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CartItemControlsProps = {
  productId: string;
  quantity: number;
  stock: number;
  onRemove: () => void;
};

const MAX_QTY = 99;
const DEBOUNCE_MS = 600;

export function CartItemControls({ productId, quantity, stock, onRemove }: CartItemControlsProps) {
  const router = useRouter();
  const [localQty, setLocalQty] = useState(quantity);
  const [inputValue, setInputValue] = useState(String(quantity));
  const [syncing, setSyncing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedQtyRef = useRef(quantity);
  const localQtyRef = useRef(quantity);

  // Sync from server only when there are no local pending edits
  useEffect(() => {
    if (localQtyRef.current === committedQtyRef.current) {
      setLocalQty(quantity);
      setInputValue(String(quantity));
      committedQtyRef.current = quantity;
      localQtyRef.current = quantity;
    }
  }, [quantity]);

  const callApi = useCallback(
    async (nextQty: number) => {
      setSyncing(true);
      try {
        const response = await fetch("/api/cart/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: nextQty })
        });

        if (response.ok) {
          committedQtyRef.current = nextQty;
          router.refresh();
        } else {
          const error = await response.json().catch(() => null);
          alert(error?.error ?? "No se pudo actualizar el carrito.");
          // Revert to last committed value
          setLocalQty(committedQtyRef.current);
          setInputValue(String(committedQtyRef.current));
          localQtyRef.current = committedQtyRef.current;
        }
      } finally {
        setSyncing(false);
      }
    },
    [productId, router]
  );

  const scheduleSync = useCallback(
    (nextQty: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void callApi(nextQty), DEBOUNCE_MS);
    },
    [callApi]
  );

  const flushSync = useCallback(
    (nextQty: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void callApi(nextQty);
    },
    [callApi]
  );

  // On unmount: cancel timer and fire any unsaved change fire-and-forget
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (localQtyRef.current !== committedQtyRef.current) {
        void fetch("/api/cart/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: localQtyRef.current })
        });
      }
    };
  }, [productId]);

  function changeQty(next: number) {
    const clamped = Math.max(1, Math.min(next, MAX_QTY, stock));
    if (clamped === localQty) return;
    setLocalQty(clamped);
    setInputValue(String(clamped));
    localQtyRef.current = clamped;
    scheduleSync(clamped);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1) {
      const clamped = Math.min(num, MAX_QTY, stock);
      setLocalQty(clamped);
      localQtyRef.current = clamped;
      scheduleSync(clamped);
    }
  }

  function handleInputCommit() {
    const num = parseInt(inputValue, 10);
    const clamped = !isNaN(num) && num >= 1 ? Math.min(num, MAX_QTY, stock) : localQty;
    setLocalQty(clamped);
    setInputValue(String(clamped));
    localQtyRef.current = clamped;
    if (clamped !== committedQtyRef.current) {
      flushSync(clamped);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2">
        <div className="flex min-h-11 items-center rounded-full border border-line">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-lg"
            disabled={localQty <= 1}
            onClick={() => changeQty(localQty - 1)}
          >
            -
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInputCommit();
            }}
            className="w-[60px] bg-transparent text-center text-sm font-semibold focus:outline-none"
          />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-lg"
            disabled={localQty >= stock || localQty >= MAX_QTY}
            onClick={() => changeQty(localQty + 1)}
          >
            +
          </button>
        </div>
        {syncing ? (
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-neon/60"
            title="Sincronizando..."
          />
        ) : null}
      </div>

      <Button
        variant="danger"
        className="w-full px-4 py-2 text-red-100 sm:w-auto"
        onClick={onRemove}
      >
        Quitar
      </Button>
    </div>
  );
}
