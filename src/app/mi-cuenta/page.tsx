import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/account/change-password-form";
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

        <div className="mt-8 border-t border-line pt-8">
          <p className="text-sm uppercase tracking-[0.24em] text-mist">Seguridad</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-sand">
            Cambiar contraseña
          </h2>
          <p className="mt-2 text-sm text-mist">
            Confirmá tu contraseña actual y definí una nueva clave segura.
          </p>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
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
          <p className="text-sm text-mist">Estado de verificación</p>
          <p className="text-lg font-semibold text-sand">
            {user.emailVerified ? "Email verificado" : "Pendiente de verificación"}
          </p>
        </div>
        <div>
          <p className="text-sm text-mist">Direcciones guardadas</p>
          <p className="text-lg font-semibold text-sand">{user.addresses.length}</p>
        </div>
        {!user.emailVerified ? (
          <div className="rounded-3xl border border-amber-400/30 bg-amber-300/10 p-4 text-sm text-mist">
            Revisá el aviso superior para reenviar el correo de verificación cuando lo
            necesites.
          </div>
        ) : null}
        <div className="rounded-3xl border border-line bg-ink/60 p-4 text-sm text-mist">
          Tus datos quedan listos para agilizar la coordinación y limitar errores de entrega.
        </div>
      </aside>
    </div>
  );
}
