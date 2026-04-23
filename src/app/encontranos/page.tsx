import type { Metadata } from "next";
import { FindUsPageClient } from "@/components/site/find-us-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Encontranos | Gorilla Strong",
  description:
    "Ubicación del local, mapa y contacto directo por WhatsApp de Gorilla Strong."
};

export default function FindUsPage() {
  return <FindUsPageClient />;
}
