/**
 * Fuente única de la navegación del sitio.
 *
 * Los mismos enlaces estaban escritos tres veces —header de escritorio, menú
 * móvil y footer— cada uno con sus propias clases. Agregar una sección obligaba
 * a editar tres archivos y a acordarse de los tres.
 */
export type NavLink = {
  href: string;
  label: string;
  /** Solo visible para administradores. */
  adminOnly?: boolean;
  /** No se muestra en el footer, que lista únicamente secciones de tienda. */
  hideInFooter?: boolean;
};

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/encontranos", label: "Encontranos" },
  { href: "/carrito", label: "Carrito" },
  { href: "/mis-pedidos", label: "Mis pedidos" },
  { href: "/admin", label: "Admin", adminOnly: true, hideInFooter: true }
] as const;

export function getVisibleNavLinks(isAdmin: boolean) {
  return NAV_LINKS.filter((link) => !link.adminOnly || isAdmin);
}

export function getFooterNavLinks() {
  return NAV_LINKS.filter((link) => !link.adminOnly && !link.hideInFooter);
}

/**
 * Marca el enlace activo. `/` solo coincide exacto; el resto también con sus
 * subrutas, para que `/productos/x` no deje la navegación sin nada resaltado.
 */
export function isActiveNavLink(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
