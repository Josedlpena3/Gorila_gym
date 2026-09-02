export default function ProductLoading() {
  return (
    <div className="page-shell space-y-4">
      <div className="h-5 w-40 animate-pulse rounded-full bg-white/5" />

      <div className="grid animate-pulse gap-4 lg:grid-cols-[0.85fr,1.15fr] lg:items-start xl:gap-6">
        <div className="section-card aspect-square w-full bg-steel/60" />

        <div className="section-card space-y-4 p-4 sm:p-6 lg:p-7">
          <div className="flex gap-2">
            <div className="h-7 w-24 rounded-full bg-white/5" />
            <div className="h-7 w-20 rounded-full bg-white/5" />
          </div>
          <div className="h-4 w-32 rounded-full bg-white/5" />
          <div className="h-9 w-full rounded-full bg-steel/80" />
          <div className="h-9 w-2/3 rounded-full bg-steel/80" />

          <div className="rounded-[28px] border border-line bg-ink/55 p-4">
            <div className="h-4 w-16 rounded-full bg-white/5" />
            <div className="mt-2 h-9 w-40 rounded-full bg-steel/80" />
            <div className="mt-4 h-12 w-full rounded-full bg-steel/80 sm:max-w-xs" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-4 w-3/4 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
