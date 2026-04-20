"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

const CATEGORY_ORDER: readonly string[] = [
  "Creatinas",
  "Proteínas",
  "Pre entrenos",
  "Pancakes",
  "Aminoácidos",
  "Geles",
  "Barritas",
  "Shakers"
] as const;

function getCategoryDisplayName(name: string) {
  return name === "Panqueques" ? "Pancakes" : name;
}

function sortCategories(categories: CategoryFilter[]) {
  return [...categories].sort((categoryA, categoryB) => {
    const nameA = getCategoryDisplayName(categoryA.name);
    const nameB = getCategoryDisplayName(categoryB.name);
    const indexA = CATEGORY_ORDER.indexOf(nameA);
    const indexB = CATEGORY_ORDER.indexOf(nameB);

    if (indexA === -1 && indexB === -1) {
      return nameA.localeCompare(nameB, "es");
    }

    if (indexA === -1) {
      return 1;
    }

    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });
}

export function CatalogToolbar({
  currentQuery,
  currentCategory
}: {
  currentQuery?: string;
  currentCategory?: string;
}) {
  const [categories, setCategories] = useState<CategoryFilter[]>([]);

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

  const selectedCategory =
    categories.find((category) => category.id === currentCategory) ??
    categories.find((category) => category.slug === currentCategory);
  const sortedCategories = sortCategories(categories);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <Input
              name="q"
              defaultValue={currentQuery ?? ""}
              placeholder="Proteina, creatina, shaker, marca..."
              className="rounded-[20px] border-white/10 bg-black/20 pl-11 pr-4 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neon/40 focus:border-neon/70 sm:text-sm"
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
            className="w-full shrink-0 rounded-[20px] px-4 text-sm shadow-[0_14px_34px_rgba(183,255,57,0.16)] sm:w-auto sm:px-5"
          >
            Buscar
          </Button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {currentQuery || currentCategory ? (
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-sand transition hover:border-neon/60 hover:text-neon"
            >
              Limpiar
            </Link>
          ) : null}

          <Link
            href={buildCategoryHref()}
            className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !currentCategory
                ? "border-neon bg-neon text-ink"
                : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
            }`}
          >
            Todo
          </Link>

          {sortedCategories.map((category) => (
            <Link
              key={category.id}
              href={buildCategoryHref(category.id)}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isCurrentCategory(category)
                  ? "border-neon bg-neon text-ink"
                  : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
              }`}
            >
              {getCategoryDisplayName(category.name)}
            </Link>
          ))}
        </div>
      </div>
    </form>
  );
}
