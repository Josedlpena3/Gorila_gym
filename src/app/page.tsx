import Image from "next/image";
import Link from "next/link";

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-full bg-neon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-neon/90";

export default async function HomePage() {
  return (
    <div className="page-shell">
      <section className="relative overflow-hidden rounded-[36px] border border-line/80 bg-steel/70 px-6 py-16 shadow-premium backdrop-blur sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,255,57,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_22%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32">
            <Image
              src="/branding/logo-gorila.png"
              alt="Gorila Strong"
              width={512}
              height={512}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.36em] text-neon sm:text-sm">
            Gorila Strong
          </p>
          <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.08em] text-sand sm:text-5xl lg:text-6xl">
            Suplementación premium
          </h1>
          <div className="mt-8">
            <Link href="/catalogo" className={primaryLinkClass}>
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
