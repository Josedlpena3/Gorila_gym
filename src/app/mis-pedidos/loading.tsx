export default function OrdersLoading() {
  return (
    <div className="page-shell animate-pulse space-y-4">
      <div className="section-card p-4 sm:p-6">
        <div className="h-4 w-28 rounded-full bg-white/5" />
        <div className="mt-2 h-8 w-64 rounded-full bg-steel/80" />
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="section-card space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-full bg-white/5" />
              <div className="h-6 w-40 rounded-full bg-steel/80" />
            </div>
            <div className="h-7 w-36 rounded-full bg-white/5" />
          </div>
          <div className="space-y-2 border-t border-line pt-4">
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-4 w-2/3 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
