import { cookies } from "next/headers";
import Link from "next/link";
import { getSessionToken } from "./lib/auth";

const keyMetrics = [
  {
    value: "34 sec",
    label: "Average checkout",
    detail: "Keep queues short during peak lunch and weekend rushes.",
  },
  {
    value: "99.95%",
    label: "Sync uptime",
    detail: "Sales, stock, and team actions update in near real time.",
  },
  {
    value: "2 taps",
    label: "Refund flow",
    detail: "Resolve returns quickly with role-based approval rules.",
  },
  {
    value: "18%",
    label: "Labor savings",
    detail: "Automated shift insights reduce manual reconciliation.",
  },
];

const rolloutSteps = [
  {
    title: "Configure counters and catalog",
    description:
      "Map products, taxes, and printer rules for each station in minutes.",
  },
  {
    title: "Activate team access",
    description:
      "Assign role-based permissions for cashiers, supervisors, and managers.",
  },
  {
    title: "Launch the live console",
    description:
      "Start selling with synced dashboards for sales, inventory, and cashflow.",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = getSessionToken(cookieStore);

  const isAuthenticated = Boolean(sessionToken);

  const primaryHref = isAuthenticated ? "/dashboard" : "/login";
  const primaryLabel = isAuthenticated ? "Open Console" : "Login";
  const primaryDescription = isAuthenticated
    ? "Continue where your team left off."
    : "Sign in to start taking payments and managing stock.";

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(217,119,6,0.22),_rgba(217,119,6,0)_72%)]" />
        <div className="absolute right-4 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(120,113,108,0.18),_rgba(120,113,108,0)_70%)] sm:right-12" />
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-16 pt-8 sm:px-8 md:gap-20 lg:px-12 xl:gap-24 xl:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-surface/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-[var(--shadow-soft)]">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7.5h16v9H4z" />
                <path d="M7 10.5h4" />
                <path d="M7 13.5h7" />
                <circle cx="17" cy="12" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">PulsePOS</p>
              <p className="text-xs text-foreground/70">Point-of-sale platform</p>
            </div>
          </div>

          <Link
            href={primaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            {primaryLabel}
          </Link>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className="space-y-8 animate-rise-in">
            <p className="inline-flex rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              Built for busy counters
            </p>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Run checkout, inventory, and team workflows from one polished POS
                console.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-foreground/80 sm:text-lg">
                PulsePOS gives retail and F&amp;B teams live control over payments,
                orders, and stock with dashboards that stay clear even during peak
                demand.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-on-primary shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                {primaryLabel}
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>

              <a
                href="#platform-highlights"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                Explore features
              </a>
            </div>

            <p className="text-sm text-foreground/70">{primaryDescription}</p>
          </div>

          <div className="animate-rise-in-delay rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary/90">
                  Live shift snapshot
                </p>
                <h2 className="text-2xl font-bold tracking-tight">
                  Front Counter Console
                </h2>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                Synced
              </span>
            </div>

            <div className="space-y-3">
              <article className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                  Ticket #5418
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">4 items • Card</p>
                  <p className="text-lg font-bold text-secondary">$86.20</p>
                </div>
              </article>

              <article className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                  Inventory pulse
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">Low stock alerts</p>
                  <p className="text-lg font-bold text-warning">7</p>
                </div>
              </article>

              <article className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground/60">
                  Cash reconciliation
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">Variance</p>
                  <p className="text-lg font-bold text-success">$0.00</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {keyMetrics.map((metric) => (
            <article
              key={metric.label}
              className="animate-rise-in-delay-2 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 shadow-[var(--shadow-soft)]"
            >
              <p className="text-2xl font-bold tracking-tight text-secondary">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{metric.label}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/70">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section id="platform-highlights" className="space-y-7">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
              Platform highlights
            </p>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Purpose-built for high-volume retail and hospitality teams.
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[var(--radius-md)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h10" />
                  <circle cx="18" cy="18" r="2" />
                </svg>
              </span>
              <h4 className="mt-4 text-lg font-semibold">Lightning checkout lanes</h4>
              <p className="mt-3 text-sm leading-6 text-foreground/70">
                Barcode, manual, and weighted-item flows stay fluid with
                keyboard-first controls.
              </p>
            </article>

            <article className="rounded-[var(--radius-md)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M5 6h14v12H5z" />
                  <path d="M9 6v12" />
                  <path d="M13.5 10h3" />
                  <path d="M13.5 14h3" />
                </svg>
              </span>
              <h4 className="mt-4 text-lg font-semibold">Inventory with context</h4>
              <p className="mt-3 text-sm leading-6 text-foreground/70">
                Every sale updates stock instantly, with reorder hints by branch and
                supplier lead time.
              </p>
            </article>

            <article className="rounded-[var(--radius-md)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M5 19V9" />
                  <path d="M10 19V5" />
                  <path d="M15 19v-7" />
                  <path d="M20 19v-3" />
                  <path d="M4 19h17" />
                </svg>
              </span>
              <h4 className="mt-4 text-lg font-semibold">Decision-ready analytics</h4>
              <p className="mt-3 text-sm leading-6 text-foreground/70">
                Shift summaries surface top sellers, margin leaks, and staffing
                opportunities automatically.
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Rollout plan
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {rolloutSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[var(--radius-md)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                  {index + 1}
                </span>
                <h4 className="mt-4 text-base font-semibold tracking-tight">
                  {step.title}
                </h4>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-primary/20 bg-[linear-gradient(135deg,rgba(120,113,108,0.16),rgba(255,251,235,0.92))] p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h5 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to modernize every checkout lane?
              </h5>
              <p className="max-w-2xl text-sm leading-7 text-foreground/75 sm:text-base">
                Start with one branch, validate your workflows, then roll out to the
                full operation with confidence.
              </p>
            </div>

            <Link
              href={primaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-on-accent shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:text-on-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              {primaryLabel}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
