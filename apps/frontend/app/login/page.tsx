import { randomUUID } from "node:crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionToken } from "../lib/auth";

async function loginAction(formData: FormData) {
  "use server";

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString().trim();

  if (!email || !password) {
    redirect("/login");
  }

  const cookieStore = await cookies();

  cookieStore.set("pos_session", randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionToken = getSessionToken(cookieStore);

  if (sessionToken) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-12 sm:px-8 lg:px-12">
      <section className="grid w-full gap-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:grid-cols-2 md:p-8 lg:p-10">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            PulsePOS access
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Login to open the POS console
          </h1>
          <p className="max-w-md text-sm leading-7 text-foreground/75 sm:text-base">
            Use your staff credentials to continue to checkout, inventory, and
            shift analytics.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface-raised px-5 text-sm font-semibold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Back to home
          </Link>
        </div>

        <form
          action={loginAction}
          className="space-y-5 rounded-[var(--radius-md)] border border-border bg-surface-raised p-5 sm:p-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="cashier@store.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition duration-200 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            Login
          </button>

          <p className="text-xs leading-6 text-foreground/65">
            Demo mode: any non-empty email and password will authenticate.
          </p>
        </form>
      </section>
    </main>
  );
}
