import type { Metadata } from "next";
import { FindUsPageClient } from "@/components/site/find-us-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Encontranos | Gorila Strong",
  description:
    "Ubicación del local, mapa y contacto directo por WhatsApp de Gorila Strong."
};

export default function FindUsPage() {
  return <FindUsPageClient />;
}
