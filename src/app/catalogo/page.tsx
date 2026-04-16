import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { ProductCard } from "@/components/catalog/product-card";
import { listCatalogProducts } from "@/modules/products/product.service";
import { getCurrentUser } from "@/modules/users/user.service";

type SearchParams = Record<string, string | string[] | undefined>;

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

function getSearchParam(
  searchParams: SearchParams,
  key: "q"
) {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function buildCatalogHref(
  searchParams: SearchParams,
  overrides: Partial<Record<"q", string | undefined>>
) {
  const keys = ["q"] as const;
  const params = new URLSearchParams();

  keys.forEach((key) => {
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

export default async function CatalogPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const currentQuery = getSearchParam(searchParams, "q");
  const [data, user] = await Promise.all([
    listCatalogProducts({
      q: currentQuery
    }),
    getCurrentUser()
  ]);

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

      <div className="grid gap-4 md:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {data.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            requiresLogin={!user}
          />
        ))}
      </div>
    </div>
  );
}
