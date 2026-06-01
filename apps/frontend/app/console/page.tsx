import Link from "next/link";

const todayKpis = [
  {
    label: "Sales",
    value: "$18,520",
    context: "Gross for today",
  },
  {
    label: "Orders",
    value: "214",
    context: "Completed transactions",
  },
  {
    label: "Average ticket",
    value: "$86.54",
    context: "Blended basket size",
  },
  {
    label: "Weekly sales",
    value: "$114,380",
    context: "Mon to current day",
  },
];

const recentOrders = [
  {
    orderNo: "#ORD-30091",
    cashier: "M. Delacruz",
    total: "$124.30",
    time: "09:44",
  },
  {
    orderNo: "#ORD-30090",
    cashier: "J. Santos",
    total: "$89.70",
    time: "09:38",
  },
  {
    orderNo: "#ORD-30089",
    cashier: "A. Rivera",
    total: "$46.10",
    time: "09:30",
  },
  {
    orderNo: "#ORD-30088",
    cashier: "M. Delacruz",
    total: "$332.25",
    time: "09:27",
  },
];

const healthCards = [
  {
    title: "Sync state",
    value: "Healthy",
    detail: "Last sync 9 seconds ago across all active terminals.",
  },
  {
    title: "Low-stock count",
    value: "12",
    detail: "8 items below reorder point and 4 at critical level.",
  },
  {
    title: "Pending issues",
    value: "3",
    detail: "2 drawer variance investigations and 1 void approval pending.",
  },
];

const quickActions = [
  {
    label: "Add product",
    href: "/console/inventory-supply#product-catalog",
  },
  {
    label: "Open reports",
    href: "/console/reports-compliance",
  },
  {
    label: "Manage users",
    href: "/console/administration#user-management",
  },
];

export default function ConsoleDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          Dashboard
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Daily command center
        </h2>
        <p className="text-sm leading-6 text-foreground/75 sm:text-base">
          Review performance, monitor issues, and jump straight into core actions.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Today KPIs</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {todayKpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5"
            >
              <p className="text-sm font-semibold text-foreground/70">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-secondary">
                {kpi.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/70">{kpi.context}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Recent activity snapshot</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Cashier</th>
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.orderNo} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-semibold text-foreground">{order.orderNo}</td>
                    <td className="py-3 pr-4 text-foreground/75">{order.cashier}</td>
                    <td className="py-3 pr-4 text-foreground/75">{order.time}</td>
                    <td className="py-3 text-right font-semibold text-secondary">
                      {order.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Health cards</h3>
          <div className="mt-4 grid gap-3">
            {healthCards.map((health) => (
              <div
                key={health.title}
                className="rounded-[var(--radius-sm)] border border-border bg-surface p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                  {health.title}
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-secondary">
                  {health.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{health.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Quick actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface-raised px-5 py-3 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
