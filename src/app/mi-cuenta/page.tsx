import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/modules/users/user.service";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/mi-cuenta");
  }

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="section-card p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Mi cuenta</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-sand">
          Perfil y dirección
        </h1>
        <div className="mt-8">
          <ProfileForm user={user} />
        </div>
      </section>

      <aside className="section-card h-fit space-y-4 p-6">
        <Badge variant={user.role === "ADMIN" ? "success" : "default"}>
          {user.roleLabel}
        </Badge>
        <div>
          <p className="text-sm text-mist">Email</p>
          <p className="text-lg font-semibold text-sand">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-mist">Direcciones guardadas</p>
          <p className="text-lg font-semibold text-sand">{user.addresses.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
          Tus datos quedan listos para agilizar la coordinación y limitar errores de entrega.
        </div>
      </aside>
    </div>
  );
}
