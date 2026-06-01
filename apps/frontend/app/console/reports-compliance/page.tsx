const trendBars = [
  { label: "Mon", value: 56 },
  { label: "Tue", value: 61 },
  { label: "Wed", value: 48 },
  { label: "Thu", value: 72 },
  { label: "Fri", value: 79 },
  { label: "Sat", value: 86 },
  { label: "Sun", value: 64 },
];

const topItems = [
  { item: "Latte 16oz", qty: 428, revenue: "$44,940" },
  { item: "Matcha 16oz", qty: 396, revenue: "$41,580" },
  { item: "Blueberry Muffin", qty: 281, revenue: "$23,885" },
];

const readingRows = [
  {
    type: "Z-reading",
    store: "Store 01",
    period: "2026-06-01 End of Day",
    amount: "$18,520",
    status: "Filed",
  },
  {
    type: "X-reading",
    store: "Store 02",
    period: "2026-06-01 Mid-shift",
    amount: "$9,840",
    status: "Ready",
  },
  {
    type: "Z-reading",
    store: "Store 03",
    period: "2026-05-31 End of Day",
    amount: "$14,120",
    status: "Filed",
  },
];

const auditRows = [
  {
    date: "2026-06-01",
    sku: "COF-LAT-16",
    movement: "Adjustment",
    expected: 52,
    actual: 50,
    variance: "-2",
  },
  {
    date: "2026-06-01",
    sku: "BAK-MUF-07",
    movement: "Receiving",
    expected: 110,
    actual: 110,
    variance: "0",
  },
  {
    date: "2026-05-31",
    sku: "BEV-WAT-05",
    movement: "Transfer",
    expected: 35,
    actual: 31,
    variance: "-4",
  },
];

const promoRows = [
  { promo: "Happy Hour 10%", uses: 142, amount: "$1,280" },
  { promo: "SC Discount", uses: 88, amount: "$965" },
  { promo: "PWD Discount", uses: 47, amount: "$512" },
];

export default function ReportsCompliancePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          Reports & Compliance
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Reporting, audit, and compliance center
        </h2>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Sales analytics by date range
        </h3>
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:grid-cols-[repeat(4,minmax(0,1fr))_220px]">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Last 7 days
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Last 30 days
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Last 90 days
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Custom
          </button>
          <input
            type="text"
            placeholder="YYYY-MM-DD to YYYY-MM-DD"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Orders and revenue trends</h3>
          <div className="mt-4 grid grid-cols-7 items-end gap-3">
            {trendBars.map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[8px] bg-secondary/70"
                  style={{ height: `${bar.value}px` }}
                />
                <p className="text-xs font-semibold text-foreground/70">{bar.label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Top items</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Qty sold</th>
                  <th className="py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item.item} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-semibold text-foreground">{item.item}</td>
                    <td className="py-3 pr-4 text-foreground/75">{item.qty}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {item.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Z-reading and X-reading reports</h3>
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Store</th>
                <th className="py-3 pr-4">Period</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {readingRows.map((row) => (
                <tr key={`${row.type}-${row.store}-${row.period}`} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-foreground">{row.type}</td>
                  <td className="py-3 pr-4 text-foreground/75">{row.store}</td>
                  <td className="py-3 pr-4 text-foreground/75">{row.period}</td>
                  <td className="py-3 pr-4 font-semibold text-secondary">{row.amount}</td>
                  <td className="py-3 text-right text-foreground/75">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            Stock audit trail and variance reports
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Movement</th>
                  <th className="py-3 pr-4">Expected</th>
                  <th className="py-3 pr-4">Actual</th>
                  <th className="py-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row) => (
                  <tr key={`${row.date}-${row.sku}`} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground/75">{row.date}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">{row.sku}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.movement}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.expected}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.actual}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {row.variance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            Discount and promo usage analytics
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Promo</th>
                  <th className="py-3 pr-4">Uses</th>
                  <th className="py-3 text-right">Discount total</th>
                </tr>
              </thead>
              <tbody>
                {promoRows.map((promo) => (
                  <tr key={promo.promo} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-semibold text-foreground">{promo.promo}</td>
                    <td className="py-3 pr-4 text-foreground/75">{promo.uses}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {promo.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight">
          Export options for audits
        </h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Export PDF
          </button>
        </div>
      </section>
    </div>
  );
}
