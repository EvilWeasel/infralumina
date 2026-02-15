import { generateText, Output } from "ai";
import { z } from "zod";

import { getStructuredOutputModel } from "@/lib/ai/provider";
import type { Database } from "@/lib/supabase/database.types";

type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];
type MissingRequiredField = "title" | "severity";

const validSeverityValues = ["low", "medium", "high", "critical"] as const;

const extractionSchema = z.object({
  title: z.string().trim().min(1).nullable().optional(),
  severity: z.enum(validSeverityValues).nullable().optional(),
  impact: z.string().trim().min(1).nullable().optional(),
  started_at: z.string().trim().min(1).nullable().optional(),
  missing_fields: z
    .array(
      z.object({
        field: z.enum(["title", "severity"]),
        question: z.string().trim().min(1),
      }),
    )
    .nullable()
    .optional(),
});

export type IncidentIntakeExtraction = {
  title?: string;
  severity?: IncidentSeverity;
  impact?: string;
  startedAt?: string;
  missingFields: Array<{
    field: MissingRequiredField;
    question: string;
  }>;
};

function getMissingFieldQuestion(field: MissingRequiredField) {
  if (field === "title") {
    return "Welcher kurze Titel beschreibt den Incident am besten?";
  }

  return "Welche Severity passt am besten (low, medium, high, critical)?";
}

function normalizeStartedAt(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate.toISOString();
}

function hasExplicitTemporalSignal(sourceText: string) {
  const text = sourceText.toLowerCase();

  const patterns = [
    /\b\d{1,2}[:.]\d{2}\b/,
    /\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b(?:heute|gestern|vorgestern|today|yesterday|since|seit|uhr|cet|cest|utc)\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function normalizeExtraction(
  raw: z.infer<typeof extractionSchema>,
  sourceText: string,
): IncidentIntakeExtraction {
  const title = raw.title ?? undefined;
  const severity = raw.severity ?? undefined;
  const impact = raw.impact ?? undefined;
  const startedAt = hasExplicitTemporalSignal(sourceText)
    ? normalizeStartedAt(raw.started_at)
    : undefined;

  const missingByField = new Map<MissingRequiredField, string>();

  for (const missingField of raw.missing_fields ?? []) {
    missingByField.set(missingField.field, missingField.question);
  }

  if (!title) {
    missingByField.set("title", missingByField.get("title") ?? getMissingFieldQuestion("title"));
  }

  if (!severity) {
    missingByField.set(
      "severity",
      missingByField.get("severity") ?? getMissingFieldQuestion("severity"),
    );
  }

  const missingFields = Array.from(missingByField.entries()).map(([field, question]) => ({
    field,
    question,
  }));

  return {
    title,
    severity,
    impact,
    startedAt,
    missingFields,
  };
}

function buildSystemPrompt() {
  return [
    "Du extrahierst Incident-Felder aus unstrukturiertem Text.",
    "Antworte ausschliesslich mit JSON ohne Markdown.",
    "Erfinde keine Pflichtdaten.",
    "Pflichtfelder: title, severity.",
    "Optional: impact, started_at (ISO 8601).",
    "Wenn title oder severity fehlen, gib missing_fields mit klaren Fragen aus.",
    "severity muss exakt einer dieser Werte sein: low, medium, high, critical.",
    "Wenn unsure: severity weglassen und fehlendes Feld nachfragen.",
    "started_at nur ausgeben, wenn der Eingabetext eine explizite Zeit- oder Datumsangabe enthaelt.",
    "Wenn keine explizite Zeit im Text steht, started_at weglassen.",
  ].join(" ");
}

export async function extractIncidentFromText(
  sourceText: string,
): Promise<IncidentIntakeExtraction> {
  try {
    const { output } = await generateText({
      model: getStructuredOutputModel(),
      output: Output.object({ schema: extractionSchema }),
      temperature: 0,
      maxRetries: 2,
      system: buildSystemPrompt(),
      prompt: sourceText,
    });

    return normalizeExtraction(output, sourceText);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler bei der AI-Analyse.";
    throw new Error(`AI Analyse fehlgeschlagen: ${message}`);
  }
}
