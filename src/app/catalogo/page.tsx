import { ProductCard } from "@/components/catalog/product-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OBJECTIVE_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { listCatalogProducts } from "@/modules/products/product.service";
import { getCurrentUser } from "@/modules/users/user.service";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CatalogPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const [data, user] = await Promise.all([
    listCatalogProducts({
      q: typeof searchParams.q === "string" ? searchParams.q : undefined,
      category:
        typeof searchParams.category === "string" ? searchParams.category : undefined,
      brand: typeof searchParams.brand === "string" ? searchParams.brand : undefined,
      type: typeof searchParams.type === "string" ? searchParams.type : undefined,
      objective:
        typeof searchParams.objective === "string" ? searchParams.objective : undefined,
      minPrice:
        typeof searchParams.minPrice === "string" ? searchParams.minPrice : undefined,
      maxPrice:
        typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : undefined
    }),
    getCurrentUser()
  ]);

  return (
    <div className="page-shell space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-mist">Catálogo</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Suplementos para rendimiento real
        </h1>
      </div>

      <form className="section-card grid gap-4 p-5 lg:grid-cols-6">
        <Input
          name="q"
          defaultValue={typeof searchParams.q === "string" ? searchParams.q : ""}
          placeholder="Buscar por nombre, marca o categoría"
          className="lg:col-span-2"
        />
        <Select
          name="category"
          defaultValue={
            typeof searchParams.category === "string" ? searchParams.category : ""
          }
        >
          <option value="">Todas las categorías</option>
          {data.categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          name="brand"
          defaultValue={typeof searchParams.brand === "string" ? searchParams.brand : ""}
        >
          <option value="">Todas las marcas</option>
          {data.brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>
        <Select
          name="type"
          defaultValue={typeof searchParams.type === "string" ? searchParams.type : ""}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          name="objective"
          defaultValue={
            typeof searchParams.objective === "string" ? searchParams.objective : ""
          }
        >
          <option value="">Todos los objetivos</option>
          {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          name="minPrice"
          defaultValue={
            typeof searchParams.minPrice === "string" ? searchParams.minPrice : ""
          }
          placeholder="Precio mínimo"
        />
        <Input
          type="number"
          name="maxPrice"
          defaultValue={
            typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : ""
          }
          placeholder="Precio máximo"
        />
        <button className="rounded-2xl bg-neon px-5 py-3 text-sm font-semibold text-ink">
          Filtrar
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-mist">
        <p>{data.products.length} productos encontrados</p>
        <p>{data.brands.length} marcas disponibles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
