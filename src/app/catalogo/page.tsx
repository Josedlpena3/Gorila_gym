import { unstable_noStore as noStore } from "next/cache";
import { CatalogProductFeed } from "@/components/catalog/catalog-product-feed";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { StatusCard } from "@/components/layout/status-card";
import { listCatalogProducts } from "@/modules/products/product.service";
import { tryGetCurrentUser } from "@/modules/users/user.service";

type SearchParams = Record<string, string | string[] | undefined>;
type CatalogFilterKey =
  | "q"
  | "category"
  | "brand"
  | "objective"
  | "minPrice"
  | "maxPrice";

const QUICK_CATALOG_LINKS: ReadonlyArray<{
  label: string;
  q?: string;
  showsAll?: boolean;
}> = [
  { label: "Todo", showsAll: true },
  { label: "Creatinas", q: "creatina" },
  { label: "Proteinas", q: "proteina" },
  { label: "Combos", q: "combo" },
  { label: "Barritas", q: "barrita" },
  { label: "Panqueques", q: "panqueque" },
  { label: "Shakers", q: "shaker" }
];

const CATALOG_FILTER_KEYS: readonly CatalogFilterKey[] = [
  "q",
  "category",
  "brand",
  "objective",
  "minPrice",
  "maxPrice"
];

export const dynamic = "force-dynamic";

function getSearchParam(
  searchParams: SearchParams,
  key: CatalogFilterKey
) {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function buildCatalogHref(
  searchParams: SearchParams,
  overrides: Partial<Record<"q", string | undefined>>
) {
  const params = new URLSearchParams();

  (["q"] as const).forEach((key) => {
    const value = Object.prototype.hasOwnProperty.call(overrides, key)
      ? overrides[key]
      : getSearchParam(searchParams, key);

    if (typeof value === "string" && value.trim().length > 0) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query.length > 0 ? `/catalogo?${query}` : "/catalogo";
}

function buildCatalogApiQuery(searchParams: SearchParams) {
  const params = new URLSearchParams();

  CATALOG_FILTER_KEYS.forEach((key) => {
    const value = getSearchParam(searchParams, key);

    if (typeof value === "string" && value.trim().length > 0) {
      params.set(key, value);
    }
  });

  return params.toString();
}

async function loadCatalogProducts(searchParams: SearchParams) {
  try {
    return await listCatalogProducts({
      q: getSearchParam(searchParams, "q"),
      category: getSearchParam(searchParams, "category"),
      brand: getSearchParam(searchParams, "brand"),
      objective: getSearchParam(searchParams, "objective"),
      minPrice: getSearchParam(searchParams, "minPrice"),
      maxPrice: getSearchParam(searchParams, "maxPrice"),
      page: 1,
      limit: 20
    });
  } catch (error) {
    console.error("[catalog-page] no se pudo cargar el catálogo", error);
    return null;
  }
}

export default async function CatalogPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  noStore();
  const currentQuery = getSearchParam(searchParams, "q");
  const apiQuery = buildCatalogApiQuery(searchParams);
  const [data, user] = await Promise.all([
    loadCatalogProducts(searchParams),
    tryGetCurrentUser("catalog-page")
  ]);

  if (!data) {
    return (
      <div className="page-shell">
        <StatusCard
          eyebrow="Catálogo"
          title="No se pudo cargar el catálogo."
          description="La página sigue respondiendo, pero la base de datos no devolvió productos en este momento. Revisá `DATABASE_URL`, el estado de Prisma y reintentá."
          actions={[
            { href: "/catalogo", label: "Reintentar" },
            { href: "/", label: "Volver a la home", variant: "secondary" }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <CatalogToolbar
        currentQuery={currentQuery}
        quickLinks={QUICK_CATALOG_LINKS.map((item) => ({
          label: item.label,
          href: buildCatalogHref(searchParams, { q: item.q }),
          isActive: item.showsAll
            ? !currentQuery
            : item.q
              ? currentQuery?.toLowerCase() === item.q
              : false
        }))}
      />

      <CatalogProductFeed
        initialData={data}
        requiresLogin={!user}
        queryString={apiQuery}
      />
    </div>
  );
}
