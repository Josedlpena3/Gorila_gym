import Image from "next/image";
import { cn } from "@/lib/utils";

type GorillaRoarProps = {
  /**
   * `loop` ruge solo, en ciclo: para estados de carga.
   * `hover` ruge cuando el mouse entra o el elemento recibe foco de teclado:
   * para el logo del header, donde una animación permanente distraería.
   */
  mode?: "loop" | "hover";
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
 * El logo animado: un gorila que ruge.
 *
 * El arte es negro sobre fondo blanco y sin canal alfa, así que conserva el
 * disco claro —sobre el tema oscuro, un gorila negro recortado sería invisible—.
 * El disco es también el tratamiento que el header ya venía usando.
 *
 * Las ondas expansivas viven fuera del contenedor recortado: adentro, el
 * `overflow-hidden` que redondea el disco las cortaría.
 */
export function GorillaRoar({
  mode = "hover",
  size = "sm",
  className,
  priority = false
}: GorillaRoarProps) {
  const { box, px } = SIZES[size];
  const isLoop = mode === "loop";

  return (
    <span
      className={cn("group/roar relative inline-flex shrink-0", box, className)}
    >
      {[0, 1].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{ animationDelay: index === 0 ? undefined : "0.22s" }}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl border border-neon opacity-0 motion-reduce:hidden",
            isLoop
              ? "animate-shockwave"
              : "group-hover/roar:animate-shockwave-burst"
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
            isLoop ? "animate-roar" : "group-hover/roar:animate-roar-burst"
          )}
        />
      </span>
    </span>
  );
}
