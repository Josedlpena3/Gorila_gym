"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * `compact` deja solo el icono. En tablet el header no tiene ancho para el
 * texto completo cuando hay sesión de administrador —la navegación se partía en
 * dos líneas—, y compactar un control de utilidad es preferible a esconder un
 * enlace de navegación.
 */
export function LogoutButton({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const { refresh } = useSession();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      aria-label={compact ? "Cerrar sesión" : undefined}
      className={cn(
        "px-4 py-2 text-sm",
        compact && "w-11 px-0 lg:w-auto lg:px-4",
        className
      )}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await api.post("/api/auth/logout").catch(() => null);
          // El header lee la sesión del cliente, así que hay que refrescarla:
          // router.refresh() solo revalida el árbol del servidor.
          await refresh();
          router.push("/catalogo");
          router.refresh();
        })
      }
    >
      {compact ? (
        <>
          <LogOut className="h-4 w-4 lg:hidden" aria-hidden="true" />
          <span className="hidden lg:inline">
            {isPending ? "Saliendo..." : "Cerrar sesión"}
          </span>
        </>
      ) : isPending ? (
        "Saliendo..."
      ) : (
        "Cerrar sesión"
      )}
    </Button>
  );
}
