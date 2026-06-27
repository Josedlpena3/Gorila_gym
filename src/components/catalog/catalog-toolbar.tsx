"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  "Alimentos",
  "Aminoácidos",
  "Hidratación",
  "Barritas",
] as const;

function getCategoryDisplayName(category: CategoryFilter) {
  if (category.slug === "panqueques") return "Alimentos";
  if (category.slug === "geles") return "Hidratación";
  return category.name;
}

function sortCategories(categories: CategoryFilter[]) {
  return [...categories].sort((a, b) => {
    const nameA = getCategoryDisplayName(a);
    const nameB = getCategoryDisplayName(b);
    const indexA = CATEGORY_ORDER.indexOf(nameA);
    const indexB = CATEGORY_ORDER.indexOf(nameB);
    if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB, "es");
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

export function CatalogToolbar({
  currentQuery,
  currentCategory,
  categories: categoriesProp
}: {
  currentQuery?: string;
  currentCategory?: string;
  categories: CategoryFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [searchTerm, setSearchTerm] = useState(currentQuery ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    currentCategory ?? null
  );
  const [isPending, startTransition] = useTransition();
  const suppressNextSync = useRef(false);

  const visibleCategories = categoriesProp.filter((c) => c.slug !== "shakers");
  const sortedCategories = sortCategories(visibleCategories);

  const selectedCategory =
    visibleCategories.find((c) => c.id === currentCategory) ??
    visibleCategories.find((c) => c.slug === currentCategory);

  // Sync local input when URL changes (e.g. back button, category click)
  useEffect(() => {
    if (suppressNextSync.current) {
      suppressNextSync.current = false;
      return;
    }
    setSearchTerm(currentQuery ?? "");
  }, [currentQuery]);

  useEffect(() => {
    setActiveCategoryId(selectedCategory?.id ?? currentCategory ?? null);
  }, [currentCategory, selectedCategory?.id]);

  function replaceCatalogParams(nextParams: URLSearchParams) {
    const nextQuery = nextParams.toString();
    if (nextQuery === searchParamsString) return;
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function handleSearchSubmit() {
    const trimmedSearch = searchTerm.trim();
    const nextParams = new URLSearchParams(searchParamsString);

    nextParams.delete("page");
    nextParams.delete("categoryId");
    nextParams.delete("category");
    nextParams.delete("brand");
    setActiveCategoryId(null);

    if (trimmedSearch.length > 0) {
      nextParams.set("q", trimmedSearch);
    } else {
      nextParams.delete("q");
    }

    replaceCatalogParams(nextParams);
  }

  function handleClearAll() {
    suppressNextSync.current = true;
    setSearchTerm("");
    setActiveCategoryId(null);
    replaceCatalogParams(new URLSearchParams());
  }

  function handleCategoryToggle(categoryId?: string) {
    const nextCategoryId =
      categoryId && activeCategoryId === categoryId ? null : (categoryId ?? null);
    const nextParams = new URLSearchParams(searchParamsString);

    suppressNextSync.current = true;
    setSearchTerm("");
    setActiveCategoryId(nextCategoryId);

    nextParams.delete("q");
    nextParams.delete("brand");
    nextParams.delete("page");
    nextParams.delete("category");

    if (nextCategoryId) {
      nextParams.set("categoryId", nextCategoryId);
    } else {
      nextParams.delete("categoryId");
    }

    replaceCatalogParams(nextParams);
  }

  return (
    <div className="section-card relative z-20 mx-auto max-w-5xl overflow-visible px-3 py-2.5 sm:px-4 sm:py-4">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent" />

      <div className="flex flex-col gap-4">
        <div className="mb-2 flex items-center gap-2 md:mb-4">
          <div className="relative min-w-0 flex-1 max-w-sm md:max-w-md">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist" />
            <Input
              name="q"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit();
              }}
              placeholder="Proteína, creatina, marca… (Enter para buscar)"
              className="h-[38px] min-h-[38px] rounded-[18px] border-white/10 bg-black/20 px-3 pl-8 pr-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neon/40 focus:border-neon/70 md:h-[44px] md:min-h-[44px] md:px-4 md:pl-9 md:pr-4 md:text-base"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="inline-flex h-[38px] items-center whitespace-nowrap rounded-[18px] border border-neon/60 bg-neon/10 px-4 text-sm font-semibold text-neon transition hover:bg-neon/20 md:h-[44px]"
          >
            Buscar
          </button>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(searchTerm.trim() && currentQuery) || activeCategoryId ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-sand transition hover:border-neon/60 hover:text-neon"
            >
              Limpiar
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => handleCategoryToggle()}
            aria-pressed={!activeCategoryId}
            className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !activeCategoryId
                ? "border-neon bg-neon text-ink"
                : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
            }`}
          >
            Todo
          </button>

          {sortedCategories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              aria-pressed={category.id === activeCategoryId}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                category.id === activeCategoryId
                  ? "border-neon bg-neon text-ink"
                  : "border-white/10 bg-black/20 text-sand hover:border-neon/50 hover:text-neon"
              }`}
            >
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>

        {isPending ? <p className="text-xs text-mist">Actualizando catálogo...</p> : null}
      </div>
    </div>
  );
}
