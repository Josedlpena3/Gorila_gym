export default function CartLoading() {
  return (
    <div className="page-shell animate-pulse space-y-4">
      <div className="h-5 w-40 rounded-full bg-white/5" />

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr] lg:gap-6">
        <section className="section-card p-4 sm:p-6">
          <div className="h-4 w-24 rounded-full bg-white/5" />
          <div className="mt-2 h-8 w-56 rounded-full bg-steel/80" />

          <div className="mt-6 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-[28px] border border-line bg-ink/60 p-4 sm:gap-4"
              >
                <div className="h-24 w-24 shrink-0 rounded-3xl bg-steel/80 sm:h-28 sm:w-28" />
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded-full bg-white/5" />
                    <div className="h-6 w-3/4 rounded-full bg-steel/80" />
                  </div>
                  <div className="h-11 w-40 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="section-card h-fit p-4 sm:p-6">
          <div className="h-7 w-32 rounded-full bg-steel/80" />
          <div className="mt-6 space-y-3 border-t border-line pt-4">
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-6 w-2/3 rounded-full bg-steel/80" />
          </div>
          <div className="mt-6 h-[52px] w-full rounded-full bg-steel/80" />
        </aside>
      </div>
    </div>
  );
}
