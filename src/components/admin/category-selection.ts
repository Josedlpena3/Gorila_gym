/**
 * Decide si el formulario de producto tiene que elegir una categoría por
 * defecto, y cuál.
 *
 * Vive fuera del componente —sin React ni "use client"— para poder probarla
 * directamente. El motivo es un bug concreto: el efecto que elegía la categoría
 * por defecto también re-escribía la del producto en cada render, y como el
 * estado seleccionado estaba entre sus dependencias, cada vez que el
 * administrador elegía otra categoría el efecto la pisaba con la original. La
 * categoría no se podía cambiar.
 *
 * La regla es: si ya hay algo elegido, no se toca nunca.
 *
 * @returns el id a seleccionar, o `null` si no hay que cambiar nada.
 */
export function resolveDefaultCategoryId({
  selectedCategoryId,
  productCategoryId,
  availableCategories
}: {
  selectedCategoryId: string;
  productCategoryId?: string | null;
  availableCategories: ReadonlyArray<{ id: string }>;
}): string | null {
  // Ya hay una elección —la del usuario, o la del producto que `useState` puso
  // como valor inicial—. Volver a escribirla es justamente lo que rompía el
  // cambio de categoría.
  if (selectedCategoryId || productCategoryId) {
    return null;
  }

  return availableCategories[0]?.id ?? null;
}
