const orders = [
  {
    id: "#ORD-30091",
    status: "Paid",
    customer: "Walk-in",
    cashier: "M. Delacruz",
    store: "Store 01",
    total: "$124.30",
    timestamp: "2026-06-01 09:44",
  },
  {
    id: "#ORD-30090",
    status: "Paid",
    customer: "P. Gonzales",
    cashier: "J. Santos",
    store: "Store 01",
    total: "$89.70",
    timestamp: "2026-06-01 09:38",
  },
  {
    id: "#ORD-30089",
    status: "Refunded",
    customer: "L. Cruz",
    cashier: "A. Rivera",
    store: "Store 02",
    total: "$46.10",
    timestamp: "2026-06-01 09:30",
  },
  {
    id: "#ORD-30088",
    status: "Voided",
    customer: "Walk-in",
    cashier: "M. Delacruz",
    store: "Store 03",
    total: "$332.25",
    timestamp: "2026-06-01 09:27",
  },
];

const lineItems = [
  { name: "Latte 16oz", qty: 2, amount: "$210.00" },
  { name: "Blueberry Muffin", qty: 1, amount: "$85.00" },
  { name: "VAT (12%)", qty: 1, amount: "$13.30" },
];

const cashDrawerEvents = [
  { event: "Shift open", user: "M. Delacruz", amount: "$2,000.00", time: "07:00" },
  { event: "Cash in", user: "J. Santos", amount: "$500.00", time: "08:45" },
  { event: "Cash out", user: "M. Delacruz", amount: "$250.00", time: "09:25" },
];

const customerHistory = [
  { date: "2026-05-29", order: "#ORD-29817", total: "$765.20", tags: "SC" },
  { date: "2026-05-23", order: "#ORD-29110", total: "$420.00", tags: "PWD" },
  { date: "2026-05-18", order: "#ORD-28751", total: "$912.50", tags: "SC" },
];

export default function SalesPosPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          Sales & POS
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Transaction and cashier controls
        </h2>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Orders list with search and status filter</h3>
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            placeholder="Search order number or customer"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <select className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
            <option>Status: all</option>
            <option>Paid</option>
            <option>Refunded</option>
            <option>Voided</option>
          </select>
          <select className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
            <option>Store: all</option>
            <option>Store 01</option>
            <option>Store 02</option>
            <option>Store 03</option>
          </select>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Apply filter
          </button>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Cashier / Store</th>
                <th className="py-3 pr-4">Timestamp</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-foreground">{order.id}</td>
                  <td className="py-3 pr-4 text-foreground/75">{order.status}</td>
                  <td className="py-3 pr-4 text-foreground/75">{order.customer}</td>
                  <td className="py-3 pr-4 text-foreground/75">
                    {order.cashier} / {order.store}
                  </td>
                  <td className="py-3 pr-4 text-foreground/75">{order.timestamp}</td>
                  <td className="py-3 text-right font-semibold text-secondary">
                    {order.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Order detail view</h3>
          <div className="mt-4 grid gap-4 text-sm text-foreground/80 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-foreground">Order:</span> #ORD-30091
            </p>
            <p>
              <span className="font-semibold text-foreground">Cashier:</span> M. Delacruz
            </p>
            <p>
              <span className="font-semibold text-foreground">Store:</span> Store 01
            </p>
            <p>
              <span className="font-semibold text-foreground">Timestamp:</span> 2026-06-01 09:44
            </p>
            <p>
              <span className="font-semibold text-foreground">Payment:</span> Card (Visa)
            </p>
            <p>
              <span className="font-semibold text-foreground">Reference:</span> TXN-11A91
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Line item</th>
                  <th className="py-3 pr-4">Qty</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.name} className="border-b border-border/70">
                    <td className="py-3 pr-4 text-foreground">{item.name}</td>
                    <td className="py-3 pr-4 text-foreground/75">{item.qty}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {item.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-error px-5 text-sm font-semibold text-on-error transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              Void
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-warning px-5 text-sm font-semibold text-on-warning transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              Refund / Return
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              Receipt reprint
            </button>
          </div>
        </article>

        <article className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Cash management</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-foreground/60">Shift session</p>
                <p className="mt-1 text-base font-semibold text-secondary">Open #S-1092</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-foreground/60">Cash in/out</p>
                <p className="mt-1 text-base font-semibold text-secondary">3 events</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-foreground/60">Drawer variance</p>
                <p className="mt-1 text-base font-semibold text-success">$0.00</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                    <th className="py-3 pr-4">Drawer event</th>
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cashDrawerEvents.map((event) => (
                    <tr key={`${event.event}-${event.time}`} className="border-b border-border/70">
                      <td className="py-3 pr-4 text-foreground">{event.event}</td>
                      <td className="py-3 pr-4 text-foreground/75">{event.user}</td>
                      <td className="py-3 pr-4 text-foreground/75">{event.time}</td>
                      <td className="py-3 text-right font-semibold text-secondary">
                        {event.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Customer panel</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              Customer lookup, SC/PWD tagging, and purchase history.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="search"
                placeholder="Lookup customer"
                className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <select className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                <option>Tag: none</option>
                <option>SC</option>
                <option>PWD</option>
              </select>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Order</th>
                    <th className="py-3 pr-4">Tags</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {customerHistory.map((history) => (
                    <tr key={history.order} className="border-b border-border/70">
                      <td className="py-3 pr-4 text-foreground/75">{history.date}</td>
                      <td className="py-3 pr-4 font-semibold text-foreground">{history.order}</td>
                      <td className="py-3 pr-4 text-foreground/75">{history.tags}</td>
                      <td className="py-3 text-right font-semibold text-secondary">
                        {history.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
