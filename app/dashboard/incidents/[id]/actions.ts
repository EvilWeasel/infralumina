"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { canWriteIncidents } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import type { Database } from "@/lib/supabase/database.types";

export type IncidentDetailActionState = {
  status: "idle" | "success" | "error";
  message: string;
  updatedAt: string | null;
};

type IncidentStatus = Database["public"]["Enums"]["incident_status"];
type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

type UpdateIncidentMetaInput = {
  incidentId: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
};

export type UpdateIncidentMetaResult = IncidentDetailActionState & {
  title?: string;
  statusValue?: IncidentStatus;
  severityValue?: IncidentSeverity;
  resolvedAt?: string | null;
};

const validStatuses = new Set(["open", "in_progress", "resolved"]);
const validSeverities = new Set(["low", "medium", "high", "critical"]);

function parseIncidentId(rawValue: string) {
  if (rawValue.trim().length === 0) {
    throw new Error("Missing incident id");
  }

  return rawValue;
}

function parseTitle(rawValue: string) {
  const title = rawValue.trim();

  if (!title) {
    throw new Error("Title is required");
  }

  return title;
}

function parseStatus(rawValue: string) {
  if (!validStatuses.has(rawValue)) {
    throw new Error("Status is invalid");
  }

  return rawValue as IncidentStatus;
}

function parseSeverity(rawValue: string) {
  if (!validSeverities.has(rawValue)) {
    throw new Error("Severity is invalid");
  }

  return rawValue as IncidentSeverity;
}

function parseDocumentContent(rawValue: unknown) {
  if (!Array.isArray(rawValue)) {
    throw new Error("Document payload must be an array of blocks");
  }

  return rawValue;
}

function createErrorState(message: string): IncidentDetailActionState {
  return {
    status: "error",
    message,
    updatedAt: null,
  };
}

export async function updateIncidentMetaAction(
  input: UpdateIncidentMetaInput,
): Promise<UpdateIncidentMetaResult> {
  try {
    const authContext = await requireAuthenticatedUser();

    if (!canWriteIncidents(authContext.profile.role)) {
      throw new Error("Write access required");
    }

    const incidentId = parseIncidentId(input.incidentId);
    const title = parseTitle(input.title);
    const status = parseStatus(input.status);
    const severity = parseSeverity(input.severity);

    const db = getDb();

    const [existingIncident] = await db
      .select({
        id: schema.incidents.id,
        resolvedAt: schema.incidents.resolvedAt,
      })
      .from(schema.incidents)
      .where(eq(schema.incidents.id, incidentId))
      .limit(1);

    if (!existingIncident) {
      throw new Error("Incident not found");
    }

    const resolvedAt = status === "resolved" ? existingIncident.resolvedAt ?? new Date() : null;

    const [updatedIncident] = await db
      .update(schema.incidents)
      .set({
        title,
        status,
        severity,
        resolvedAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.incidents.id, incidentId))
      .returning({
        title: schema.incidents.title,
        status: schema.incidents.status,
        severity: schema.incidents.severity,
        resolvedAt: schema.incidents.resolvedAt,
        updatedAt: schema.incidents.updatedAt,
      });

    if (!updatedIncident) {
      throw new Error("Failed to update incident metadata");
    }

    revalidatePath("/dashboard/incidents");
    revalidatePath(`/dashboard/incidents/${incidentId}`);

    return {
      status: "success",
      message: "Metadaten gespeichert.",
      updatedAt: updatedIncident.updatedAt?.toISOString() ?? null,
      title: updatedIncident.title,
      statusValue: updatedIncident.status,
      severityValue: updatedIncident.severity,
      resolvedAt: updatedIncident.resolvedAt?.toISOString() ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update metadata";
    return createErrorState(message);
  }
}

export async function saveIncidentDocumentAction(input: {
  incidentId: string;
  contentJson: unknown;
}): Promise<IncidentDetailActionState> {
  try {
    const authContext = await requireAuthenticatedUser();

    if (!canWriteIncidents(authContext.profile.role)) {
      throw new Error("Write access required");
    }

    const incidentId = parseIncidentId(input.incidentId);
    const contentJson = parseDocumentContent(input.contentJson);

    const db = getDb();

    const savedTimestamp = await db.transaction(async (tx) => {
      const [incidentRow] = await tx
        .select({ id: schema.incidents.id })
        .from(schema.incidents)
        .where(eq(schema.incidents.id, incidentId))
        .limit(1);

      if (!incidentRow) {
        throw new Error("Incident not found");
      }

      const [savedDocument] = await tx
        .insert(schema.incidentDocuments)
        .values({
          incidentId,
          contentJson,
          updatedBy: authContext.user.id,
        })
        .onConflictDoUpdate({
          target: schema.incidentDocuments.incidentId,
          set: {
            contentJson,
            updatedBy: authContext.user.id,
            updatedAt: new Date(),
          },
        })
        .returning({ updatedAt: schema.incidentDocuments.updatedAt });

      await tx
        .update(schema.incidents)
        .set({ updatedAt: new Date() })
        .where(eq(schema.incidents.id, incidentId));

      return savedDocument.updatedAt;
    });

    revalidatePath("/dashboard/incidents");

    return {
      status: "success",
      message: "Dokument gespeichert.",
      updatedAt: savedTimestamp?.toISOString() ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save document";
    return createErrorState(message);
  }
}
