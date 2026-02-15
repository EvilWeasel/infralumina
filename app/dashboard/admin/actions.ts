"use server";

import { revalidatePath } from "next/cache";

import type { UserRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

const validRoles = new Set<UserRole>(["user", "operator", "admin"]);

function parseRole(value: FormDataEntryValue | null): UserRole {
  if (typeof value !== "string" || !validRoles.has(value as UserRole)) {
    throw new Error("Invalid role value");
  }

  return value as UserRole;
}

export async function updateUserRoleAction(formData: FormData) {
  await requireRole("admin");

  const userId = formData.get("user_id");
  const role = parseRole(formData.get("role"));

  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Missing user id");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }

  revalidatePath("/dashboard/admin");
}
