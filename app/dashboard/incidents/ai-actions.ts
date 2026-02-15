"use server";

import { revalidatePath } from "next/cache";

import { canWriteIncidents } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { extractIncidentFromText } from "@/lib/incidents/ai-intake";
import { createIncidentWithDocument } from "@/lib/incidents/create";
import type { Database } from "@/lib/supabase/database.types";

type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

const validSeverities = new Set(["low", "medium", "high", "critical"]);

export type AnalyzeIncidentIntakeResult =
  | {
      status: "success";
      data: {
        title?: string;
        severity?: IncidentSeverity;
        impact?: string;
        startedAt?: string;
        missingFields: Array<{
          field: "title" | "severity";
          question: string;
        }>;
      };
    }
  | {
      status: "error";
      message: string;
    };

export type CreateAiIncidentResult =
  | {
      status: "success";
      redirectTo: string;
    }
  | {
      status: "error";
      message: string;
    };

function parseSourceText(rawValue: string) {
  const sourceText = rawValue.trim();

  if (!sourceText) {
    throw new Error("Bitte Beschreibungstext einfuegen.");
  }

  if (sourceText.length < 12) {
    throw new Error("Der Beschreibungstext ist zu kurz fuer eine Analyse.");
  }

  return sourceText;
}

function parseTitle(rawValue: string) {
  const title = rawValue.trim();

  if (!title) {
    throw new Error("Title ist erforderlich.");
  }

  return title.slice(0, 180);
}

function parseSeverity(rawValue: string) {
  if (!validSeverities.has(rawValue)) {
    throw new Error("Severity ist ungueltig.");
  }

  return rawValue as IncidentSeverity;
}

function parseImpact(rawValue: string | undefined) {
  const impact = rawValue?.trim() ?? "";
  return impact.length > 0 ? impact : null;
}

function parseStartedAt(rawValue: string | undefined) {
  const value = rawValue?.trim() ?? "";

  if (!value) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) {
    throw new Error("Started At ist ungueltig.");
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Started At ist ungueltig.");
  }

  return parsedDate;
}

function formatDocumentDateTime(value: Date | undefined) {
  if (!value) {
    return "nicht angegeben";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function clipSourceText(sourceText: string) {
  const normalizedText = sourceText.trim();

  if (normalizedText.length <= 6000) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, 6000)}\n\n[gekürzt fuer Initial-Dokument]`;
}

function buildInitialDocumentContent(params: {
  title: string;
  severity: IncidentSeverity;
  impact: string | null;
  startedAt?: Date;
  sourceText: string;
}) {
  const startedAtText = formatDocumentDateTime(params.startedAt);
  const impactText = params.impact ?? "nicht angegeben";
  const clippedSource = clipSourceText(params.sourceText);

  return [
    {
      type: "heading",
      content: "Incident Intake (AI Draft)",
    },
    {
      type: "paragraph",
      content: `Titel: ${params.title}`,
    },
    {
      type: "paragraph",
      content: `Severity: ${params.severity}`,
    },
    {
      type: "paragraph",
      content: `Startzeit: ${startedAtText}`,
    },
    {
      type: "paragraph",
      content: `Impact: ${impactText}`,
    },
    {
      type: "heading",
      content: "Eingangstext",
    },
    {
      type: "paragraph",
      content: clippedSource,
    },
  ];
}

export async function analyzeIncidentIntakeAction(input: {
  sourceText: string;
}): Promise<AnalyzeIncidentIntakeResult> {
  try {
    const authContext = await requireAuthenticatedUser();

    if (!canWriteIncidents(authContext.profile.role)) {
      throw new Error("Write access required");
    }

    const sourceText = parseSourceText(input.sourceText);
    const extraction = await extractIncidentFromText(sourceText);

    return {
      status: "success",
      data: extraction,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Analyse fehlgeschlagen.",
    };
  }
}

export async function createAiIncidentAction(input: {
  sourceText: string;
  title: string;
  severity: string;
  impact?: string;
  startedAt?: string;
}): Promise<CreateAiIncidentResult> {
  try {
    const authContext = await requireAuthenticatedUser();

    if (!canWriteIncidents(authContext.profile.role)) {
      throw new Error("Write access required");
    }

    const sourceText = parseSourceText(input.sourceText);
    const title = parseTitle(input.title);
    const severity = parseSeverity(input.severity);
    const impact = parseImpact(input.impact);
    const startedAt = parseStartedAt(input.startedAt);

    const initialDocumentContent = buildInitialDocumentContent({
      title,
      severity,
      impact,
      startedAt,
      sourceText,
    });

    const incidentId = await createIncidentWithDocument({
      title,
      severity,
      impact,
      reporterId: authContext.user.id,
      startedAt,
      initialDocumentContentJson: initialDocumentContent,
    });

    revalidatePath("/dashboard/incidents");
    revalidatePath(`/dashboard/incidents/${incidentId}`);

    return {
      status: "success",
      redirectTo: `/dashboard/incidents/${incidentId}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Incident konnte nicht erstellt werden.",
    };
  }
}
