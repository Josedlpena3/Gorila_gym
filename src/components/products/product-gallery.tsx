"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import type { ProductImageDto } from "@/types";

type ProductGalleryProps = {
  images: ProductImageDto[];
  fallback: {
    url: string;
    alt: string;
  };
  mode?: "card" | "detail";
};

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7.5 4.5L13 10l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconButton({
  children,
  label,
  onClick,
  className = ""
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/75 text-sand transition hover:border-neon/60 hover:text-neon ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function ProductGallery({
  images,
  fallback,
  mode = "detail"
}: ProductGalleryProps) {
  const items = images.length > 0 ? images : [{ id: "fallback", ...fallback }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current === 0 ? items.length - 1 : current - 1));
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current === items.length - 1 ? 0 : current + 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, items.length]);

  function move(direction: "prev" | "next") {
    setActiveIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? items.length - 1 : current - 1;
      }

      return current === items.length - 1 ? 0 : current + 1;
    });
  }

  if (mode === "card") {
    return (
      <div className="relative h-64 overflow-hidden">
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {items.length > 1 ? (
          <>
            <IconButton
              label="Imagen anterior"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2"
              onClick={() => move("prev")}
            >
              <ArrowLeftIcon />
            </IconButton>
            <IconButton
              label="Imagen siguiente"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2"
              onClick={() => move("next")}
            >
              <ArrowRightIcon />
            </IconButton>
            <div className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-sand">
              {activeIndex + 1}/{items.length}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-steel">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="relative block h-[420px] w-full cursor-zoom-in"
            aria-label="Abrir imagen en visor"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              className="object-cover"
            />
          </button>

          {items.length > 1 ? (
            <>
              <IconButton
                label="Imagen anterior"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
                onClick={() => move("prev")}
              >
                <ArrowLeftIcon />
              </IconButton>
              <IconButton
                label="Imagen siguiente"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
                onClick={() => move("next")}
              >
                <ArrowRightIcon />
              </IconButton>
              <div className="absolute bottom-4 right-4 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-sand">
                {activeIndex + 1}/{items.length}
              </div>
            </>
          ) : null}
        </div>

        {items.length > 1 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-32 overflow-hidden rounded-3xl border bg-steel ${
                  activeIndex === index ? "border-neon" : "border-line"
                }`}
              >
                <Image src={image.url} alt={image.alt} fill className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-ink/95 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-mist">
                Imagen {activeIndex + 1} de {items.length}
              </p>
              <IconButton label="Cerrar visor" onClick={() => setIsLightboxOpen(false)}>
                <CloseIcon />
              </IconButton>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[34px] border border-line bg-ink/80">
              <div className="relative h-full min-h-[320px] w-full">
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {items.length > 1 ? (
                <>
                  <IconButton
                    label="Imagen anterior"
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
                    onClick={() => move("prev")}
                  >
                    <ArrowLeftIcon />
                  </IconButton>
                  <IconButton
                    label="Imagen siguiente"
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
                    onClick={() => move("next")}
                  >
                    <ArrowRightIcon />
                  </IconButton>
                </>
              ) : null}
            </div>

            {items.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {items.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-20 min-w-[88px] overflow-hidden rounded-2xl border ${
                      activeIndex === index ? "border-neon" : "border-line"
                    }`}
                  >
                    <Image src={image.url} alt={image.alt} fill className="object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
