import { describe, expect, it } from "vitest";
import { normalizeProductImageUrl } from "@/lib/product-image";

const BASE = "https://res.cloudinary.com/daxmqtfai/image/upload";
const RUTA = "v1776615267/gorila-products/products/creatina.png";
const CLOUDINARY = `${BASE}/${RUTA}`;

/**
 * Las fotos del catálogo son capturas subidas como PNG de hasta 394 KB y con
 * relaciones de aspecto distintas. La transformación las deja todas en 800x800
 * y baja el peso ~90%.
 *
 * El recorte de fondo con IA (`e_background_removal`) se probó y se quitó: no
 * era fiable sobre este set de fotos. Los tests fijan que NO vuelva por la
 * ventana a través de una URL vieja guardada en un carrito de invitado.
 */
describe("normalizeProductImageUrl", () => {
  it("inserta la transformación después de /upload/ y conserva la ruta del archivo", () => {
    const resultado = normalizeProductImageUrl(CLOUDINARY);

    expect(resultado).toBe(
      `${BASE}/c_pad,w_800,h_800,b_transparent,f_auto,q_auto/${RUTA}`
    );
  });

  it("encuadra sin recortar: una foto de producto no se puede cortar", () => {
    // c_pad rellena hasta el cuadrado; c_fill o c_crop recortarían el envase.
    expect(normalizeProductImageUrl(CLOUDINARY)).toContain("c_pad");
    expect(normalizeProductImageUrl(CLOUDINARY)).not.toContain("c_fill");
    expect(normalizeProductImageUrl(CLOUDINARY)).not.toContain("c_crop");
  });

  it("no aplica recorte de fondo", () => {
    expect(normalizeProductImageUrl(CLOUDINARY)).not.toContain("e_background_removal");
  });

  it("descarta el recorte de fondo de una URL vieja en vez de encadenarlo", () => {
    // Es el caso real: un carrito de invitado guardado mientras el recorte
    // estaba activo. Anteponer la transformación nueva dejaría las dos en
    // cadena y Cloudinary volvería a recortar.
    const vieja = `${BASE}/e_background_removal/c_pad,w_800,h_800,b_transparent,f_auto,q_auto/${RUTA}`;

    const resultado = normalizeProductImageUrl(vieja);

    expect(resultado).not.toContain("e_background_removal");
    expect(resultado).toBe(normalizeProductImageUrl(CLOUDINARY));
  });

  it("es idempotente: aplicarla dos veces da lo mismo que una", () => {
    const unaVez = normalizeProductImageUrl(CLOUDINARY);

    expect(normalizeProductImageUrl(unaVez)).toBe(unaVez);
    expect(unaVez.match(/c_pad/g)).toHaveLength(1);
  });

  it("deja intactas las URLs que no son de Cloudinary", () => {
    const externa = "https://starnutrition.com.ar/img/producto.jpg";

    expect(normalizeProductImageUrl(externa)).toBe(externa);
  });

  it("devuelve null cuando no hay imagen", () => {
    expect(normalizeProductImageUrl(null)).toBeNull();
    expect(normalizeProductImageUrl(undefined)).toBeNull();
    expect(normalizeProductImageUrl("")).toBeNull();
  });
});
