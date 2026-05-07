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
  if (category.slug === "panqueques") {
    return "Alimentos";
  }

  if (category.slug === "geles") {
    return "Hidratación";
  }

  return category.name;
}

function sortCategories(categories: CategoryFilter[]) {
  return [...categories].sort((categoryA, categoryB) => {
    const nameA = getCategoryDisplayName(categoryA);
    const nameB = getCategoryDisplayName(categoryB);
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [searchTerm, setSearchTerm] = useState(currentQuery ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    currentCategory ?? null
  );
  const [isPending, startTransition] = useTransition();
  const suppressNextSearchEffect = useRef(false);

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
          payload
            .filter(
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
            .filter((category) => category.slug !== "shakers")
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

  useEffect(() => {
    suppressNextSearchEffect.current = true;
    setSearchTerm(currentQuery ?? "");
  }, [currentQuery]);

  useEffect(() => {
    setActiveCategoryId(selectedCategory?.id ?? currentCategory ?? null);
  }, [currentCategory, selectedCategory?.id]);

  function isCurrentCategory(category: CategoryFilter) {
    return category.id === activeCategoryId;
  }

  function replaceCatalogParams(nextParams: URLSearchParams) {
    const nextQuery = nextParams.toString();

    if (nextQuery === searchParamsString) {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function handleClearAll() {
    suppressNextSearchEffect.current = true;
    setSearchTerm("");
    setActiveCategoryId(null);
    replaceCatalogParams(new URLSearchParams());
  }

  function handleCategoryToggle(categoryId?: string) {
    const nextCategoryId =
      categoryId && activeCategoryId === categoryId ? null : (categoryId ?? null);
    const nextParams = new URLSearchParams(searchParamsString);

    suppressNextSearchEffect.current = true;
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

  useEffect(() => {
    if (suppressNextSearchEffect.current) {
      suppressNextSearchEffect.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParamsString);
      const trimmedSearch = searchTerm.trim();
      const nextQueryParams = nextParams;

      nextQueryParams.delete("page");
      nextQueryParams.delete("categoryId");
      nextQueryParams.delete("category");
      nextQueryParams.delete("brand");

      setActiveCategoryId(null);

      if (trimmedSearch.length > 0) {
        nextQueryParams.set("q", trimmedSearch);
      } else {
        nextQueryParams.delete("q");
      }

      const nextQuery = nextQueryParams.toString();

      if (nextQuery === searchParamsString) {
        return;
      }

      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router, searchParamsString, searchTerm]);

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
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              placeholder="Proteina, creatina, shaker, marca..."
              className="h-[38px] min-h-[38px] rounded-[18px] border-white/10 bg-black/20 px-3 pl-8 pr-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-neon/40 focus:border-neon/70 md:h-[44px] md:min-h-[44px] md:px-4 md:pl-9 md:pr-4 md:text-base"
            />
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {searchTerm.trim() || activeCategoryId ? (
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
              aria-pressed={isCurrentCategory(category)}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isCurrentCategory(category)
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
