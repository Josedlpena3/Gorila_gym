import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirectTo =
    typeof searchParams.next === "string" ? searchParams.next : "/mi-cuenta";

  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-lg p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Acceso</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] text-sand sm:text-4xl">
          Iniciar sesión
        </h1>
        <p className="mt-3 text-mist">
          Accedé a tu cuenta para gestionar carrito, pedidos y dirección.
        </p>
        <div className="mt-8">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
