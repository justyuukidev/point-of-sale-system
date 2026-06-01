import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionToken, SESSION_COOKIE_NAMES } from "../lib/auth";
import { CONSOLE_NAV_ITEMS } from "./nav-items";

async function logoutAction() {
  "use server";

  const cookieStore = await cookies();

  for (const cookieName of SESSION_COOKIE_NAMES) {
    cookieStore.delete(cookieName);
  }

  redirect("/login");
}

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = getSessionToken(cookieStore);

  if (!sessionToken) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-4 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-soft)] sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            PulsePOS Console
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Retail operations workspace
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface-raised px-5 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Landing page
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="grid flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Navigation
          </p>
          <nav className="mt-4 grid gap-3">
            {CONSOLE_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[var(--radius-sm)] border border-border bg-surface-raised p-3 transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-foreground/70">
                  {item.description}
                </p>
              </Link>
            ))}
          </nav>
        </aside>

        <section className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:p-8">
          {children}
        </section>
      </div>
    </div>
  );
}
