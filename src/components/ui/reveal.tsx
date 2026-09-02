"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Aparición al entrar en pantalla: el bloque sube unos píxeles y se funde.
 *
 * Usa IntersectionObserver y se desconecta apenas dispara, así que no queda
 * observando durante todo el scroll. Si el sistema pide movimiento reducido, el
 * contenido aparece directamente visible y no se anima nada.
 */
export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      className={cn(
        // La clase la usa el <noscript> del layout para forzar visibilidad:
        // sin JavaScript el observador nunca corre y el bloque quedaría en
        // opacidad 0 para siempre.
        "js-reveal motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "motion-safe:translate-y-4 motion-safe:opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
