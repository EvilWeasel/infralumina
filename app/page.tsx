import { redirect } from "next/navigation";

import { signInWithGitHub } from "@/lib/auth/actions";
import { getCurrentAuthContext } from "@/lib/auth/session";

type LandingPageProps = {
  searchParams?: Promise<{
    auth_error?: string;
  }>;
};

const authErrorMessages: Record<string, string> = {
  callback_failed: "Der Login ist fehlgeschlagen. Bitte versuche es erneut.",
  missing_code: "Der Login konnte nicht abgeschlossen werden.",
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect("/dashboard/incidents");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const authError = resolvedSearchParams?.auth_error;
  const errorMessage = authError ? authErrorMessages[authError] : undefined;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Infralumina
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
            Internes Incident Management mit minimaler Friction.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Infralumina hilft deinem Team, Incidents schnell zu erfassen und danach sauber
            zu dokumentieren. Startpunkt fuer Phase 0: Login, Dashboard-Einstieg und
            belastbare Grundstruktur fuer den Incident-Workflow.
          </p>

          {errorMessage ? (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <form
            action={async () => {
              "use server";
              await signInWithGitHub("/dashboard/incidents");
            }}
            className="mt-8"
          >
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Mit GitHub anmelden
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
