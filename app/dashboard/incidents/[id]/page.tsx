import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { IncidentDocumentEditor } from "@/components/incidents/incident-document-editor";
import { IncidentMetaForm } from "@/components/incidents/incident-meta-form";
import { Badge } from "@/components/ui/badge";
import { canWriteIncidents } from "@/lib/auth/roles";
import { getCurrentAuthContext } from "@/lib/auth/session";
import {
  formatIncidentSeverityLabel,
  formatIncidentStatusLabel,
  getIncidentSeverityBadgeClass,
  getIncidentStatusBadgeClass,
} from "@/lib/incidents/presentation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type IncidentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(value: string | null, fallback = "-") {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();
  const canWrite = authContext ? canWriteIncidents(authContext.profile.role) : false;

  const supabase = await createSupabaseServerClient();

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id, title, status, severity, reporter_id, created_at, started_at, resolved_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (incidentError) {
    throw new Error(`Failed to load incident detail: ${incidentError.message}`);
  }

  if (!incident) {
    notFound();
  }

  const [{ data: reporterProfile, error: reporterError }, { data: incidentDocument, error: documentError }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("github_username")
        .eq("user_id", incident.reporter_id)
        .maybeSingle(),
      supabase
        .from("incident_documents")
        .select("content_json, updated_at")
        .eq("incident_id", incident.id)
        .maybeSingle(),
    ]);

  if (reporterError) {
    throw new Error(`Failed to load reporter profile: ${reporterError.message}`);
  }

  if (documentError) {
    throw new Error(`Failed to load incident document: ${documentError.message}`);
  }

  const reporterLabel = reporterProfile?.github_username ?? incident.reporter_id;

  return (
    <section className="grid gap-3 md:h-[calc(100dvh-3rem)] md:grid-rows-[auto_auto_minmax(0,1fr)]">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/incidents" className="text-sm text-muted-foreground hover:underline">
          ← Incidents
        </Link>
        <p className="text-xs text-muted-foreground">
          Incident aktualisiert: {formatDateTime(incident.updated_at)}
        </p>
      </div>

      <details className="group rounded-lg border border-border/60 bg-card/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{incident.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className={getIncidentStatusBadgeClass(incident.status)}
              >
                {formatIncidentStatusLabel(incident.status)}
              </Badge>
              <Badge
                variant="outline"
                className={getIncidentSeverityBadgeClass(incident.severity)}
              >
                {formatIncidentSeverityLabel(incident.severity)}
              </Badge>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            Meta
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </span>
        </summary>

        <div className="space-y-4 border-t border-border/50 px-4 py-4">
          <IncidentMetaForm
            incidentId={incident.id}
            initialTitle={incident.title}
            initialStatus={incident.status}
            initialSeverity={incident.severity}
            canWrite={canWrite}
          />

          <dl className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Reporter</dt>
              <dd className="mt-1 font-medium">{reporterLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="mt-1 font-medium">{formatDateTime(incident.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="mt-1 font-medium">{formatDateTime(incident.started_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Resolved</dt>
              <dd className="mt-1 font-medium">{formatDateTime(incident.resolved_at, "Open")}</dd>
            </div>
          </dl>
        </div>
      </details>

      <div className="flex min-h-0 flex-col rounded-lg border border-border/60 bg-card/20 p-3">
        <IncidentDocumentEditor
          incidentId={incident.id}
          initialContentJson={incidentDocument?.content_json ?? []}
          initialDocumentUpdatedAt={incidentDocument?.updated_at ?? null}
          canWrite={canWrite}
        />
      </div>
    </section>
  );
}
