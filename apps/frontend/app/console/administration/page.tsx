const users = [
  {
    name: "Maria Delacruz",
    email: "maria@pulsepos.local",
    role: "Store Manager",
    status: "Active",
    store: "Store 01",
  },
  {
    name: "Juan Santos",
    email: "juan@pulsepos.local",
    role: "Cashier",
    status: "Active",
    store: "Store 01",
  },
  {
    name: "Ana Rivera",
    email: "ana@pulsepos.local",
    role: "Inventory Officer",
    status: "Inactive",
    store: "Store 02",
  },
];

const stores = [
  {
    name: "Store 01",
    terminal: "T-01A",
    serial: "POS-01-8821",
    status: "Online",
  },
  {
    name: "Store 02",
    terminal: "T-02B",
    serial: "POS-02-8844",
    status: "Online",
  },
  {
    name: "Store 03",
    terminal: "T-03A",
    serial: "POS-03-8950",
    status: "Maintenance",
  },
];

const accessRows = [
  {
    role: "Admin",
    dashboard: "Full",
    sales: "Full",
    inventory: "Full",
    reports: "Full",
    admin: "Full",
  },
  {
    role: "Manager",
    dashboard: "Full",
    sales: "Full",
    inventory: "Full",
    reports: "View",
    admin: "Limited",
  },
  {
    role: "Cashier",
    dashboard: "View",
    sales: "Execute",
    inventory: "None",
    reports: "None",
    admin: "None",
  },
];

export default function AdministrationPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          Administration
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Governance and configuration controls
        </h2>
      </header>

      <section id="user-management" className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">User management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Invite user
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Bulk role update
          </button>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Store</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-foreground">{user.name}</td>
                  <td className="py-3 pr-4 text-foreground/75">{user.email}</td>
                  <td className="py-3 pr-4 text-foreground/75">{user.role}</td>
                  <td className="py-3 pr-4 text-foreground/75">{user.store}</td>
                  <td className="py-3 pr-4 text-foreground/75">{user.status}</td>
                  <td className="py-3 text-right text-foreground/75">
                    Activate/Deactivate
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Store management</h3>
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            placeholder="Store name"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="Terminal metadata"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="text"
            placeholder="POS serial"
            className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Add / Update store
          </button>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-raised p-4 sm:p-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-3 pr-4">Store</th>
                <th className="py-3 pr-4">Terminal</th>
                <th className="py-3 pr-4">Serial</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.name} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-foreground">{store.name}</td>
                  <td className="py-3 pr-4 text-foreground/75">{store.terminal}</td>
                  <td className="py-3 pr-4 text-foreground/75">{store.serial}</td>
                  <td className="py-3 pr-4 text-foreground/75">{store.status}</td>
                  <td className="py-3 text-right text-foreground/75">Edit / Delete</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">Business settings</h3>
          <div className="mt-4 grid gap-3">
            <input
              type="text"
              placeholder="Legal business name"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="text"
              placeholder="TIN"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="text"
              placeholder="Business address"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="text"
              placeholder="Contact number / email"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">BIR settings</h3>
          <div className="mt-4 grid gap-3">
            <input
              type="text"
              placeholder="MIN"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="text"
              placeholder="PTU"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              type="text"
              placeholder="Default VAT rate"
              className="min-h-11 rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <textarea
              placeholder="Receipt footer"
              rows={3}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            Notifications settings and operational alerts
          </h3>
          <div className="mt-4 space-y-3 text-sm text-foreground/80">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              Low-stock alerts
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              Shift variance warnings
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4" />
              Daily report digest
            </label>
          </div>
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight">
            Access control and role-based visibility
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-foreground/60">
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Dashboard</th>
                  <th className="py-3 pr-4">Sales</th>
                  <th className="py-3 pr-4">Inventory</th>
                  <th className="py-3 pr-4">Reports</th>
                  <th className="py-3">Admin</th>
                </tr>
              </thead>
              <tbody>
                {accessRows.map((row) => (
                  <tr key={row.role} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-semibold text-foreground">{row.role}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.dashboard}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.sales}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.inventory}</td>
                    <td className="py-3 pr-4 text-foreground/75">{row.reports}</td>
                    <td className="py-3 text-foreground/75">{row.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
