import { getDb, schema } from "@/lib/db";
import type { Database } from "@/lib/supabase/database.types";

type IncidentSeverity = Database["public"]["Enums"]["incident_severity"];

type CreateIncidentWithDocumentInput = {
  title: string;
  severity: IncidentSeverity;
  reporterId: string;
  impact?: string | null;
  startedAt?: Date;
  initialDocumentContentJson?: unknown;
};

export async function createIncidentWithDocument(
  input: CreateIncidentWithDocumentInput,
): Promise<string> {
  const db = getDb();
  const now = new Date();

  const incidentId = await db.transaction(async (tx) => {
    const [createdIncident] = await tx
      .insert(schema.incidents)
      .values({
        title: input.title,
        severity: input.severity,
        impact: input.impact ?? null,
        startedAt: input.startedAt ?? now,
        reporterId: input.reporterId,
      })
      .returning({ id: schema.incidents.id });

    await tx.insert(schema.incidentDocuments).values({
      incidentId: createdIncident.id,
      contentJson: input.initialDocumentContentJson ?? [],
      updatedBy: input.reporterId,
    });

    return createdIncident.id;
  });

  return incidentId;
}
