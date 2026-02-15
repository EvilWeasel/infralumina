import type { Database } from "@/lib/supabase/database.types";

type IncidentStatus = Database["public"]["Enums"]["incident_status"];
type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

export function formatIncidentStatusLabel(status: IncidentStatus) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
}

export function formatIncidentSeverityLabel(severity: IncidentSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function getIncidentStatusBadgeClass(status: IncidentStatus) {
  switch (status) {
    case "open":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    case "in_progress":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "resolved":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    default:
      return "";
  }
}

export function getIncidentSeverityBadgeClass(severity: IncidentSeverity) {
  switch (severity) {
    case "low":
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
    case "medium":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "high":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "critical":
      return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "";
  }
}
