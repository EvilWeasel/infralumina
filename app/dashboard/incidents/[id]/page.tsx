import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type IncidentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Open";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("id, title, status, severity, started_at, resolved_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load incident detail: ${error.message}`);
  }

  if (!incident) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <Link href="/dashboard/incidents" className="text-sm text-muted-foreground hover:underline">
        ← Incidents
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{incident.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{incident.status}</Badge>
        <Badge variant="outline">{incident.severity}</Badge>
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Started</dt>
          <dd className="mt-1 font-medium">{formatDateTime(incident.started_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Resolved</dt>
          <dd className="mt-1 font-medium">{formatDateTime(incident.resolved_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="mt-1 font-medium">{formatDateTime(incident.updated_at)}</dd>
        </div>
      </dl>

      <p className="mt-8 text-sm text-muted-foreground">
        Diese Detailseite ist als Navigationsziel aktiv. Vollstaendige Meta-Bearbeitung und
        BlockNote-Editor folgen in P0-07.
      </p>
    </section>
  );
}
