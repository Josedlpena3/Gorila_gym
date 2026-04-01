import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="section-card mx-auto max-w-2xl p-10 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-mist">404</p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.08em] text-sand">
          No encontramos esa página
        </h1>
        <p className="mt-4 text-mist">
          El enlace puede estar vencido o el contenido ya no existir.
        </p>
        <Link href="/" className="mt-6 inline-flex">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

