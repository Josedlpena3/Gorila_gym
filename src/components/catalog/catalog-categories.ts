export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

const CATEGORY_ORDER: readonly string[] = [
  "Proteínas",
  "Creatinas",
  "Alimentos",
  "Pre entrenos",
  "Accesorios",
  "Aminoácidos",
  "Hidratación",
  "Barritas"
] as const;

export function getCategoryDisplayName(category: CatalogCategory) {
  if (category.slug === "panqueques") return "Alimentos";
  if (category.slug === "geles") return "Hidratación";
  return category.name;
}

export function sortCatalogCategories(categories: CatalogCategory[]) {
  return [...categories].sort((left, right) => {
    const nameA = getCategoryDisplayName(left);
    const nameB = getCategoryDisplayName(right);
    const indexA = CATEGORY_ORDER.indexOf(nameA);
    const indexB = CATEGORY_ORDER.indexOf(nameB);

    if (indexA === -1 && indexB === -1) {
      return nameA.localeCompare(nameB, "es");
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}
