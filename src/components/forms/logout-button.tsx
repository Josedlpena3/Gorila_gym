"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      className={cn("px-4 py-2 text-sm", className)}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        })
      }
    >
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </Button>
  );
}
