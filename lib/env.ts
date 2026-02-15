const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl(): string {
  return getRequiredEnv(SUPABASE_URL_ENV);
}

export function getSupabasePublishableKey(): string {
  const publishableKey = process.env[SUPABASE_PUBLISHABLE_KEY_ENV];

  if (publishableKey) {
    return publishableKey;
  }

  const anonKey = process.env[SUPABASE_ANON_KEY_ENV];

  if (anonKey) {
    return anonKey;
  }

  throw new Error(
    `Missing required environment variable: ${SUPABASE_PUBLISHABLE_KEY_ENV} (or legacy ${SUPABASE_ANON_KEY_ENV})`,
  );
}

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing required environment variable: DATABASE_URL or SUPABASE_DB_URL",
    );
  }

  // Some providers/password managers can leave raw '%' in DB URLs.
  // postgres-js internally decodes URL parts and will throw URIError on malformed
  // percent-encoding, so we normalize only invalid '%' occurrences.
  const normalizedUrl = databaseUrl
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/%(?![0-9A-Fa-f]{2})/g, "%25");

  return normalizedUrl;
}
