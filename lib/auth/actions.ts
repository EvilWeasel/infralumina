"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";

function buildAuthRedirectUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

async function startGitHubOAuth(params?: {
  nextPath?: string;
  forceAccountSelection?: boolean;
}) {
  const nextPath = params?.nextPath ?? "/dashboard/incidents";
  const headersStore = await headers();
  const origin = headersStore.get("origin") ?? "http://localhost:3000";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: buildAuthRedirectUrl(origin, nextPath),
      queryParams: params?.forceAccountSelection
        ? {
            prompt: "select_account",
          }
        : undefined,
    },
  });

  if (error || !data.url) {
    throw new Error(`GitHub sign-in failed: ${error?.message ?? "Missing auth URL"}`);
  }

  redirect(data.url);
}

export async function signInWithGitHub(nextPath = "/dashboard/incidents") {
  await startGitHubOAuth({ nextPath });
}

export async function switchGitHubAccount(input?: FormData | string) {
  const nextPath = typeof input === "string" ? input : "/dashboard/incidents";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign-out before switch failed: ${error.message}`);
  }

  await startGitHubOAuth({
    nextPath,
    forceAccountSelection: true,
  });
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign-out failed: ${error.message}`);
  }

  redirect("/");
}
