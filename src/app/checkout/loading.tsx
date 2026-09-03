export default function CheckoutLoading() {
  return (
    <div className="page-shell animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded-full bg-white/5" />
        <div className="h-9 w-72 rounded-full bg-surface-raised" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-white/5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr] lg:gap-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <section key={index} className="section-card space-y-4 p-4 sm:p-6">
              <div className="h-5 w-40 rounded-full bg-surface-raised" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-white/5" />
                  <div className="h-11 w-full rounded-2xl bg-white/5" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded-full bg-white/5" />
                  <div className="h-11 w-full rounded-2xl bg-white/5" />
                </div>
              </div>
            </section>
          ))}
        </div>

        <aside className="section-card h-fit space-y-4 p-4 sm:p-6">
          <div className="h-6 w-32 rounded-full bg-surface-raised" />
          <div className="space-y-3 border-t border-hairline pt-4">
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-4 w-full rounded-full bg-white/5" />
            <div className="h-7 w-2/3 rounded-full bg-surface-raised" />
          </div>
          <div className="h-[52px] w-full rounded-full bg-surface-raised" />
        </aside>
      </div>
    </div>
  );
}
