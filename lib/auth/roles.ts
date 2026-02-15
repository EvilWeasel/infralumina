import type { Database } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

const ROLE_ORDER: Record<UserRole, number> = {
  user: 0,
  operator: 1,
  admin: 2,
};

export function hasAtLeastRole(currentRole: UserRole, requiredRole: UserRole) {
  return ROLE_ORDER[currentRole] >= ROLE_ORDER[requiredRole];
}

export function canWriteIncidents(role: UserRole) {
  return hasAtLeastRole(role, "operator");
}

export function canManageUsers(role: UserRole) {
  return hasAtLeastRole(role, "admin");
}
