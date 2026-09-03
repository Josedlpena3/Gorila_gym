import Image from "next/image";
import { cn } from "@/lib/utils";

type GorillaScreamProps = {
  /**
   * `calm` grita cada 7 s: para el header, donde vive permanentemente.
   * `quick` cada 2,6 s: para estados de carga, que duran poco y necesitan
   * mostrar actividad.
   */
  pace?: "calm" | "quick";
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const SIZES = {
  sm: { box: "h-10 w-10 sm:h-12 sm:w-12", px: 96 },
  md: { box: "h-20 w-20", px: 160 },
  lg: { box: "h-28 w-28", px: 224 }
} as const;

/**
 * El logo animado: el gorila grita solo, cada tanto.
 *
 * El arte es negro sobre fondo blanco y sin canal alfa, así que conserva el
 * disco claro —recortado sobre el tema oscuro, un gorila negro sería
 * invisible—. El disco es además el tratamiento que el header ya venía usando.
 *
 * Las ondas del grito viven fuera del contenedor recortado: adentro, el
 * `overflow-hidden` que redondea el disco las cortaría.
 */
export function GorillaScream({
  pace = "calm",
  size = "sm",
  className,
  priority = false
}: GorillaScreamProps) {
  const { box, px } = SIZES[size];
  const isQuick = pace === "quick";

  return (
    <span className={cn("relative inline-flex shrink-0", box, className)}>
      {[0, 1].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          // La segunda onda va apenas detrás para que se lea como un doble
          // golpe en vez de un solo anillo.
          style={{ animationDelay: index === 0 ? undefined : "0.18s" }}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl border border-neon opacity-0 motion-reduce:hidden",
            isQuick ? "animate-scream-wave-quick" : "animate-scream-wave"
          )}
        />
      ))}

      <span className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        <Image
          src="/branding/logo-gorila.png"
          alt="Gorilla Strong"
          width={px}
          height={px}
          priority={priority}
          className={cn(
            "h-full w-full object-cover will-change-transform motion-reduce:animate-none",
            isQuick ? "animate-scream-quick" : "animate-scream"
          )}
        />
      </span>
    </span>
  );
}
