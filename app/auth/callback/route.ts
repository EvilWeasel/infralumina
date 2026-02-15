import { NextResponse, type NextRequest } from "next/server";

import { ensureCurrentUserProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/dashboard/incidents";

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?auth_error=callback_failed", request.url));
  }

  await ensureCurrentUserProfile();

  return NextResponse.redirect(new URL(nextPath, request.url));
}
