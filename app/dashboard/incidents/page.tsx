import Link from "next/link";

import { NewIncidentSheet } from "@/components/incidents/new-incident-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canWriteIncidents } from "@/lib/auth/roles";
import { getCurrentAuthContext } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Open";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusBadgeVariant(status: Database["public"]["Enums"]["incident_status"]) {
  switch (status) {
    case "open":
      return "destructive";
    case "in_progress":
      return "secondary";
    case "resolved":
      return "outline";
    default:
      return "outline";
  }
}

function getSeverityBadgeVariant(severity: Database["public"]["Enums"]["incident_severity"]) {
  switch (severity) {
    case "critical":
      return "destructive";
    case "high":
      return "secondary";
    case "medium":
      return "default";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

export default async function IncidentsPage() {
  const authContext = await getCurrentAuthContext();
  const canCreateIncidents = authContext
    ? canWriteIncidents(authContext.profile.role)
    : false;

  const supabase = await createSupabaseServerClient();

  const { data: incidents, error: incidentsError } = await supabase
    .from("incidents")
    .select("id, title, status, severity, started_at, resolved_at, reporter_id, updated_at")
    .order("updated_at", { ascending: false });

  if (incidentsError) {
    throw new Error(`Failed to load incidents: ${incidentsError.message}`);
  }

  const reporterIds = Array.from(new Set(incidents.map((incident) => incident.reporter_id)));
  const reporterMap = new Map<string, string>();

  if (reporterIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, github_username")
      .in("user_id", reporterIds);

    if (profilesError) {
      throw new Error(`Failed to load reporter profiles: ${profilesError.message}`);
    }

    for (const profile of profiles) {
      reporterMap.set(profile.user_id, profile.github_username ?? "Unbekannt");
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Incidents</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Uebersicht aller Incidents mit Status, Severity und Reporter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateIncidents ? <NewIncidentSheet /> : null}
          <Button disabled={!canCreateIncidents}>AI Create (P0-08)</Button>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          Noch keine Incidents vorhanden.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Resolved</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const href = `/dashboard/incidents/${incident.id}`;

                return (
                  <tr key={incident.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={href}
                      className="font-medium text-foreground hover:underline"
                    >
                      {incident.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={href} className="inline-flex">
                      <Badge variant={getStatusBadgeVariant(incident.status)}>
                        {incident.status}
                      </Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={href} className="inline-flex">
                      <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={href} className="block hover:underline">
                      {formatDateTime(incident.started_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={href} className="block hover:underline">
                      {formatDateTime(incident.resolved_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={href} className="block hover:underline">
                      {reporterMap.get(incident.reporter_id) ?? "Unbekannt"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={href} className="block hover:underline">
                      {formatDateTime(incident.updated_at)}
                    </Link>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
