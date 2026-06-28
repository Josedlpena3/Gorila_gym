"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";

type Props = {
  productId: string;
  productSlug: string;
  productName: string;
  productBrand: string;
  productImage: string | null;
  productPrice: number;
  productStock: number;
  disabled?: boolean;
  requiresLogin?: boolean;
  nextPath?: string;
};

const MAX_QTY = 99;

export function ProductAddToCart(props: Props) {
  const max = Math.min(props.productStock, MAX_QTY);
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1");

  function changeQty(next: number) {
    const clamped = Math.max(1, Math.min(next, max));
    setQuantity(clamped);
    setInputValue(String(clamped));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1) {
      setQuantity(Math.min(num, max));
    }
  }

  function handleInputCommit() {
    const num = parseInt(inputValue, 10);
    const clamped = !isNaN(num) && num >= 1 ? Math.min(num, max) : quantity;
    setQuantity(clamped);
    setInputValue(String(clamped));
  }

  return (
    <div className="flex flex-col gap-3">
      {!props.disabled ? (
        <div className="flex min-h-11 w-fit items-center rounded-full border border-line">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-lg text-sand transition hover:text-neon disabled:opacity-30"
            disabled={quantity <= 1}
            onClick={() => changeQty(quantity - 1)}
          >
            −
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
            className="w-[60px] bg-transparent text-center text-sm font-semibold text-sand focus:outline-none"
          />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-lg text-sand transition hover:text-neon disabled:opacity-30"
            disabled={quantity >= max}
            onClick={() => changeQty(quantity + 1)}
          >
            +
          </button>
        </div>
      ) : null}

      <AddToCartButton {...props} quantity={quantity} />
    </div>
  );
}
