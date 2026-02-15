import { redirect } from "next/navigation";

import { updateUserRoleAction } from "@/app/dashboard/admin/actions";
import { canManageUsers } from "@/lib/auth/roles";
import { getCurrentAuthContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function AdminPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    redirect("/");
  }

  if (!canManageUsers(authContext.profile.role)) {
    redirect("/dashboard/incidents");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("user_id, github_username, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load users: ${error.message}`);
  }

  const roleOptions = ["user", "operator", "admin"] as const;

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Verwalte Rollen fuer alle Benutzer. Berechtigungen werden serverseitig geprueft.
      </p>

      {profiles.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Noch keine Benutzerprofile vorhanden.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">GitHub</th>
                <th className="px-4 py-3 font-medium">User ID</th>
                <th className="px-4 py-3 font-medium">Rolle</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.user_id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {profile.github_username ?? "Unbekannt"}
                    {profile.user_id === authContext.user.id ? (
                      <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        Du
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {profile.user_id}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={profile.user_id} />
                      <select
                        name="role"
                        defaultValue={profile.role}
                        className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(profile.updated_at).toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {profile.role === "admin" ? "Kann Rollen verwalten" : "Kein Admin"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
