import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { verifyEmailByToken } from "@/modules/auth/auth.service";

type VerifyEmailPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function getParam(
  searchParams: VerifyEmailPageProps["searchParams"],
  key: string
) {
  return typeof searchParams[key] === "string" ? searchParams[key] : "";
}

export default async function VerifyEmailPage({
  searchParams
}: VerifyEmailPageProps) {
  const token = getParam(searchParams, "token");
  const status = getParam(searchParams, "status");
  const reason = getParam(searchParams, "reason");

  if (token) {
    try {
      await verifyEmailByToken(token);
    } catch (error) {
      const code =
        error instanceof AppError && error.message.includes("ya estaba verificado")
          ? "already"
          : "invalid";

      redirect(`/verificar-email?status=error&reason=${code}`);
    }

    redirect("/verificar-email?status=success");
  }

  const isSuccess = status === "success";
  const title = isSuccess
    ? "Email verificado"
    : reason === "already"
      ? "Tu email ya estaba verificado"
      : "No se pudo verificar el email";
  const description = isSuccess
    ? "La cuenta quedó verificada correctamente. Ya podés iniciar sesión y completar compras."
    : reason === "already"
      ? "La cuenta ya estaba validada. Podés seguir usando la tienda normalmente."
      : "El enlace es inválido, venció o ya fue utilizado. Iniciá sesión para reenviar uno nuevo.";

  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-mist">Verificación</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] text-sand">
          {title}
        </h1>
        <p className="mt-4 text-mist">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={isSuccess ? "/login?verified=1" : "/login"} className="inline-flex">
            <Button>Ir a login</Button>
          </Link>
          <Link href="/catalogo" className="inline-flex">
            <Button variant="secondary">Ir al catálogo</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
