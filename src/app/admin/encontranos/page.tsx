import { StatusCard } from "@/components/layout/status-card";
import { SiteConfigForm } from "@/components/admin/site-config-form";
import { getSiteConfig } from "@/modules/site-config/site-config.service";

export default async function AdminFindUsPage() {
  try {
    const siteConfig = await getSiteConfig();

    return <SiteConfigForm initialConfig={siteConfig} />;
  } catch (error) {
    console.error("[admin-find-us] no se pudo cargar la configuración", error);

    return (
      <StatusCard
        eyebrow="Admin"
        title="No se pudo cargar Encontranos."
        description="La configuración del local no respondió correctamente. Revisá Prisma, la base remota y reintentá."
        actions={[{ href: "/admin/encontranos", label: "Reintentar" }]}
      />
    );
  }
}
