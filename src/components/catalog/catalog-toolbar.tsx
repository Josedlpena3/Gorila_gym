"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

export function CatalogToolbar({
  currentQuery,
  currentCategory
}: {
  currentQuery?: string;
  currentCategory?: string;
}) {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/categories", {
          cache: "no-store",
          signal: abortController.signal
        });
        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok || !Array.isArray(payload) || !isActive) {
          return;
        }

        setCategories(
          payload.filter(
            (entry): entry is CategoryFilter =>
              Boolean(
                entry &&
                  typeof entry === "object" &&
                  "id" in entry &&
                  "name" in entry &&
                  "slug" in entry &&
                  typeof entry.id === "string" &&
                  typeof entry.name === "string" &&
                  typeof entry.slug === "string"
              )
          )
        );
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        console.warn("[catalog-toolbar] no se pudieron cargar las categorías");
      }
    })();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!isExploreOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExploreOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExploreOpen]);

  const selectedCategory =
    categories.find((category) => category.id === currentCategory) ??
    categories.find((category) => category.slug === currentCategory);

  function isCurrentCategory(category: CategoryFilter) {
    return selectedCategory
      ? category.id === selectedCategory.id
      : currentCategory === category.id || currentCategory === category.slug;
  }

  function buildCategoryHref(categoryId?: string) {
    const params = new URLSearchParams();

    if (currentQuery?.trim()) {
      params.set("q", currentQuery.trim());
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    const query = params.toString();

    return query ? `/catalogo?${query}` : "/catalogo";
  }

  return (
    <form
      method="GET"
      action="/catalogo"
      className="section-card relative z-20 mx-auto max-w-5xl overflow-visible p-3 sm:p-4"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div ref={menuRef} className="relative z-30 shrink-0">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-black/20 text-sand shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neon/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon/60"
              aria-expanded={isExploreOpen}
              aria-haspopup="true"
              aria-label={isExploreOpen ? "Cerrar filtros" : "Abrir filtros"}
              onClick={() => setIsExploreOpen((current) => !current)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {isExploreOpen ? (
              <div className="absolute left-0 top-full z-20 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-ink/95 p-3 shadow-premium backdrop-blur sm:w-72">
                <div className="space-y-1">
                  <Link
                    href={buildCategoryHref()}
                    className={`block rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                      !currentCategory
                        ? "bg-neon text-ink"
                        : "text-sand hover:bg-white/5 hover:text-neon"
                    }`}
                    onClick={() => setIsExploreOpen(false)}
                  >
                    Todo
                  </Link>

                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={buildCategoryHref(category.id)}
                      className={`block rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        isCurrentCategory(category)
                          ? "bg-neon text-ink"
                          : "text-sand hover:bg-white/5 hover:text-neon"
                      }`}
                      onClick={() => setIsExploreOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <Input
              name="q"
              defaultValue={currentQuery ?? ""}
              placeholder="Proteina, creatina, shaker, marca..."
              className="h-12 rounded-[20px] border-white/10 bg-black/20 pl-11 pr-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neon/40 focus:border-neon/70"
            />
          </div>

          {currentCategory ? (
            <input
              type="hidden"
              name={selectedCategory?.id ? "categoryId" : "category"}
              value={selectedCategory?.id ?? currentCategory}
            />
          ) : null}

          <Button
            type="submit"
            className="h-12 shrink-0 rounded-[20px] px-4 text-sm shadow-[0_14px_34px_rgba(183,255,57,0.16)] sm:px-5"
          >
            Buscar
          </Button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {currentQuery || currentCategory ? (
            <Link
              href="/catalogo"
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-sand transition hover:border-neon/60 hover:text-neon"
            >
              Limpiar
            </Link>
          ) : null}

          <Link
            href={buildCategoryHref()}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !currentCategory
                ? "border-neon bg-neon text-ink"
                : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
            }`}
          >
            Todo
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={buildCategoryHref(category.id)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isCurrentCategory(category)
                  ? "border-neon bg-neon text-ink"
                  : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </form>
  );
}
