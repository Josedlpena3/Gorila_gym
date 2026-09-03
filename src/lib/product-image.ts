const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * `e_background_removal` recorta el fondo con IA. Es el cambio visual más
 * grande del catálogo: las fotos son capturas de producto sobre fondo blanco,
 * así que sin recortar cada tarjeta muestra un rectángulo blanco flotando sobre
 * el tema oscuro.
 *
 * Se verificó sobre esta cuenta de Cloudinary antes de adoptarlo:
 * `e_make_transparent` destruye el producto —los envases de proteína son
 * blancos, así que borrar el blanco borra la bolsa— mientras que el recorte con
 * IA deja el envase intacto, probado con una bolsa blanca y con una caja de
 * colores. El primer pedido de cada imagen tarda ~2,8 s mientras procesa;
 * después se sirve cacheado en ~0,1 s.
 *
 * `c_pad` encuadra sin recortar —una foto de producto nunca se puede cortar—,
 * `b_transparent` deja que el fondo oscuro de la tarjeta se vea a través del
 * relleno, y `f_auto,q_auto` entrega el mejor formato y compresión por
 * navegador.
 */
const PRODUCT_TRANSFORMATION =
  "e_background_removal/c_pad,w_800,h_800,b_transparent,f_auto,q_auto";

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

  // Si ya viene transformada (por ejemplo, una URL guardada antes en el carrito
  // de invitado) no se le encadena una segunda transformación.
  if (rest.startsWith(`${PRODUCT_TRANSFORMATION}/`)) {
    return url;
  }

  return `${prefix}${PRODUCT_TRANSFORMATION}/${rest}`;
}
