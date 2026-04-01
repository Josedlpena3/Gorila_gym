import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-lg p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Recuperación</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-mist">
          Generá un enlace seguro para restablecer el acceso a tu cuenta.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

