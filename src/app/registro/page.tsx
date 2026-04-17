import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-2xl p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Registro</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] text-sand">
          Crear cuenta
        </h1>
        <p className="mt-3 text-mist">
          Registrate para comprar, guardar tus datos y seguir cada pedido. Después
          te enviamos un correo para verificar tu email.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
