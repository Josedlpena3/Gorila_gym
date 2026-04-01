import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import {
  getAdminProductById,
  listCategories
} from "@/modules/products/product.service";

export default async function EditProductPage({
  params
}: {
  params: { id: string };
}) {
  const [product, categories] = await Promise.all([
    getAdminProductById(params.id),
    listCategories()
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm categories={categories} product={product} />;
}

