"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { refresh } = useSession();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      className={cn("px-4 py-2 text-sm", className)}
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
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </Button>
  );
}
