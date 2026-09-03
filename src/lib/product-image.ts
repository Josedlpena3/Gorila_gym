const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * `c_pad` encuadra sin recortar —una foto de producto nunca se puede cortar—,
 * `b_transparent` deja que el fondo de la tarjeta se vea a través del relleno, y
 * `f_auto,q_auto` entrega el mejor formato y compresión por navegador.
 *
 * Acá estuvo `e_background_removal`, que recortaba el fondo con IA. Se quitó
 * porque generaba problemas en el catálogo: el recorte no es fiable sobre este
 * set de fotos y algunos productos salían mal. Si en algún momento se reintenta,
 * conviene revisarlo producto por producto antes de aplicarlo a los 156.
 */
const PRODUCT_TRANSFORMATION = "c_pad,w_800,h_800,b_transparent,f_auto,q_auto";

/**
 * Normaliza las fotos de producto servidas por Cloudinary.
 *
 * Las fotos son capturas de pantalla subidas como PNG: el original de una
 * creatina pesa 394 KB y mide 632x854, y cada producto tiene una relación de
 * aspecto distinta, así que la grilla se ve irregular. Con la transformación
 * quedan todas en 800x800 y el archivo baja a ~35 KB, un 91% menos, que es
 * además lo que descarga el optimizador de imágenes de Next en cada origen.
 *
 * Las URLs que no son de Cloudinary se devuelven intactas: el catálogo también
 * admite imágenes de las marcas.
 */
export function normalizeProductImageUrl(url: string): string;
export function normalizeProductImageUrl(url: string | null | undefined): string | null;
export function normalizeProductImageUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);

  if (markerIndex === -1) {
    return url;
  }

  const cut = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
  const prefix = url.slice(0, cut);
  const rest = url.slice(cut);

  // Se descarta cualquier transformación previa y se aplica la actual desde
  // cero. En una URL de Cloudinary todo lo que va entre `/upload/` y el
  // segmento de versión (`v1776616760`) son transformaciones encadenadas, así
  // que reconstruir desde la versión garantiza que no sobreviva ninguna.
  //
  // Importa por las URLs guardadas mientras el recorte de fondo estuvo activo:
  // un carrito de invitado con `e_background_removal` seguiría mostrando la
  // foto recortada, y anteponerle la transformación nueva dejaría las dos en
  // cadena —Cloudinary las aplica en orden— reactivando el recorte.
  const versionMatch = rest.match(/(^|\/)(v\d+\/.*)$/);
  const withoutTransformations = versionMatch ? versionMatch[2] : rest;

  return `${prefix}${PRODUCT_TRANSFORMATION}/${withoutTransformations}`;
}
