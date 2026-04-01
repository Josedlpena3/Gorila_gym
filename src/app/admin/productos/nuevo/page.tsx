import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/modules/products/product.service";

export default async function NewProductPage() {
  const categories = await listCategories();

  return <ProductForm categories={categories} />;
}

