"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import type { ProductImageDto } from "@/types";

type ProductGalleryProps = {
  images: ProductImageDto[];
  fallback?: {
    url: string;
    alt: string;
  } | null;
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
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/75 text-sand transition hover:border-neon/60 hover:text-ember ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function ProductGallery({
  images,
  fallback
}: ProductGalleryProps) {
  const items =
    images.length > 0
      ? images
      : fallback?.url
        ? [{ id: "fallback", ...fallback }]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const activeImage = items[activeIndex] ?? items[0];

  useFocusTrap(lightboxRef, isLightboxOpen);

  useEffect(() => {
    setActiveIndex((current) => {
      if (items.length === 0) {
        return 0;
      }

      return current >= items.length ? 0 : current;
    });
  }, [items.length]);

  useEffect(() => {
    console.log("Imagen mostrada:", activeImage?.url ?? null);
  }, [activeImage?.url]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

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

  if (!activeImage) {
    return (
      <div className="relative overflow-hidden rounded-[34px] border border-line bg-steel">
        <div className="flex h-[300px] w-full items-center justify-center text-sm text-mist sm:h-[360px] lg:h-[420px]">
          Sin imagen disponible
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="relative overflow-hidden rounded-[34px] border border-line bg-steel">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="relative block aspect-square w-full cursor-zoom-in"
            aria-label="Abrir imagen en visor"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              className="object-contain p-4 sm:p-6 lg:p-8"
              sizes="(min-width: 1024px) 42vw, 100vw"
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
      </div>

      {isLightboxOpen ? (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[100] bg-ink/95 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imágenes"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-eyebrow text-mist">
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
                    aria-label={`Ver imagen ${index + 1} de ${items.length}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`relative h-20 min-w-[88px] overflow-hidden rounded-2xl border ${
                      activeIndex === index ? "border-neon" : "border-line"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="88px"
                      className="object-contain p-2"
                    />
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
