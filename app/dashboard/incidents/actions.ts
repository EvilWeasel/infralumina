"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWriteIncidents } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createIncidentWithDocument } from "@/lib/incidents/create";

const validSeverities = new Set(["low", "medium", "high", "critical"]);

function parseRequiredTitle(formData: FormData) {
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";

  if (!title) {
    throw new Error("Title is required");
  }

  return title;
}

function parseSeverity(formData: FormData) {
  const rawSeverity = formData.get("severity");

  if (typeof rawSeverity !== "string" || !validSeverities.has(rawSeverity)) {
    throw new Error("Severity is invalid");
  }

  return rawSeverity as "low" | "medium" | "high" | "critical";
}

function parseImpact(formData: FormData) {
  const rawImpact = formData.get("impact");
  const impact = typeof rawImpact === "string" ? rawImpact.trim() : "";

  return impact.length > 0 ? impact : null;
}

export async function createManualIncidentAction(formData: FormData) {
  const authContext = await requireAuthenticatedUser();

  if (!canWriteIncidents(authContext.profile.role)) {
    throw new Error("Write access required");
  }

  const title = parseRequiredTitle(formData);
  const severity = parseSeverity(formData);
  const impact = parseImpact(formData);

  const incidentId = await createIncidentWithDocument({
    title,
    severity,
    impact,
    reporterId: authContext.user.id,
  });

  revalidatePath("/dashboard/incidents");
  redirect(`/dashboard/incidents/${incidentId}`);
}
