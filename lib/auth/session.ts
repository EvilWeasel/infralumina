import type { User } from "@supabase/supabase-js";

import { hasAtLeastRole, type UserRole } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function isMissingSessionError(message: string) {
  return message.toLowerCase().includes("auth session missing");
}

function extractGithubUsername(user: User): string | null {
  const username = user.user_metadata.user_name ?? user.user_metadata.preferred_username;
  return typeof username === "string" ? username : null;
}

async function ensureUserProfile(user: User): Promise<UserProfileRow> {
  const supabase = await createSupabaseServerClient();
  const profileColumns = "user_id, role, github_username, created_at, updated_at";

  const { data: existingProfile, error: selectError } = await supabase
    .from("user_profiles")
    .select(profileColumns)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to read user profile: ${selectError.message}`);
  }

  if (existingProfile) {
    return existingProfile as UserProfileRow;
  }

  const githubUsername = extractGithubUsername(user);

  const { data: insertedProfile, error: insertError } = await supabase
    .from("user_profiles")
    .insert({
      user_id: user.id,
      role: "user",
      github_username: githubUsername,
    })
    .select(profileColumns)
    .single();

  if (insertError || !insertedProfile) {
    throw new Error(
      `Failed to create default user profile: ${insertError?.message ?? "Unknown error"}`,
    );
  }

  return insertedProfile as UserProfileRow;
}

export type AuthContext = {
  user: User;
  profile: UserProfileRow;
};

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isMissingSessionError(error.message)) {
      return null;
    }

    throw new Error(`Failed to fetch current user: ${error.message}`);
  }

  if (!data.user) {
    return null;
  }

  const profile = await ensureUserProfile(data.user);
  return { user: data.user, profile };
}

export async function ensureCurrentUserProfile(): Promise<UserProfileRow | null> {
  const authContext = await getCurrentAuthContext();
  return authContext?.profile ?? null;
}

export async function requireAuthenticatedUser(): Promise<AuthContext> {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    throw new UnauthorizedError("Authentication required");
  }

  return authContext;
}

export async function requireRole(requiredRole: UserRole): Promise<AuthContext> {
  const authContext = await requireAuthenticatedUser();

  if (!hasAtLeastRole(authContext.profile.role, requiredRole)) {
    throw new UnauthorizedError(
      `Role ${requiredRole} required (current role: ${authContext.profile.role})`,
    );
  }

  return authContext;
}
