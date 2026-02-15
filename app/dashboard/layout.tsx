import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentAuthContext } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authContext = await getCurrentAuthContext();

  if (!authContext) {
    redirect("/");
  }

  const userMetadata = authContext.user.user_metadata as Record<string, unknown>;
  const githubHandle =
    typeof userMetadata.user_name === "string" ? userMetadata.user_name : null;
  const avatarUrl =
    typeof userMetadata.avatar_url === "string" ? userMetadata.avatar_url : null;
  const userLabel = githubHandle ?? authContext.user.email ?? authContext.user.id;

  return (
    <DashboardShell
      role={authContext.profile.role}
      userLabel={String(userLabel)}
      avatarUrl={avatarUrl}
      email={authContext.user.email ?? null}
    >
      {children}
    </DashboardShell>
  );
}
