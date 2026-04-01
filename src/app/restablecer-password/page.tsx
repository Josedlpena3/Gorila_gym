import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  if (!token) {
    return (
      <div className="page-shell">
        <div className="section-card mx-auto max-w-lg p-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-sand">
            Falta el token de recuperación
          </h1>
          <p className="mt-4 text-mist">
            Volvé a solicitar el enlace para restablecer tu contraseña.
          </p>
          <Link href="/recuperar-password" className="mt-6 inline-flex">
            <Button>Solicitar enlace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-lg p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Nueva clave</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Restablecer contraseña
        </h1>
        <p className="mt-3 text-mist">
          Definí una contraseña nueva para volver a ingresar.
        </p>
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}

