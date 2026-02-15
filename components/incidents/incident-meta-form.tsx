"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateIncidentMetaAction } from "@/app/dashboard/incidents/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIncidentSeverityLabel, formatIncidentStatusLabel } from "@/lib/incidents/presentation";
import type { Database } from "@/lib/supabase/database.types";

type IncidentStatus = Database["public"]["Enums"]["incident_status"];
type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

type IncidentMetaFormProps = {
  incidentId: string;
  initialTitle: string;
  initialStatus: IncidentStatus;
  initialSeverity: IncidentSeverity;
  canWrite: boolean;
};

export function IncidentMetaForm({
  incidentId,
  initialTitle,
  initialStatus,
  initialSeverity,
  canWrite,
}: IncidentMetaFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<IncidentStatus>(initialStatus);
  const [severity, setSeverity] = useState<IncidentSeverity>(initialSeverity);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canWrite) {
      return;
    }

    startTransition(async () => {
      const result = await updateIncidentMetaAction({
        incidentId,
        title,
        status,
        severity,
      });

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setErrorMessage(null);
      setTitle(result.title ?? title);
      setStatus(result.statusValue ?? status);
      setSeverity(result.severityValue ?? severity);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-1.5 lg:col-span-1">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
            required
            disabled={!canWrite || isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-70"
            value={status}
            onChange={(event) => setStatus(event.target.value as IncidentStatus)}
            disabled={!canWrite || isPending}
          >
            <option value="open">{formatIncidentStatusLabel("open")}</option>
            <option value="in_progress">{formatIncidentStatusLabel("in_progress")}</option>
            <option value="resolved">{formatIncidentStatusLabel("resolved")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="severity" className="text-sm font-medium">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-70"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
            disabled={!canWrite || isPending}
          >
            <option value="low">{formatIncidentSeverityLabel("low")}</option>
            <option value="medium">{formatIncidentSeverityLabel("medium")}</option>
            <option value="high">{formatIncidentSeverityLabel("high")}</option>
            <option value="critical">{formatIncidentSeverityLabel("critical")}</option>
          </select>
        </div>

        {canWrite ? (
          <Button type="submit" disabled={isPending} className="lg:mb-0.5">
            {isPending ? "Saving..." : "Save Meta"}
          </Button>
        ) : null}
      </div>

      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </form>
  );
}
