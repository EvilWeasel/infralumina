import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let queryClient: postgres.Sql | null = null;
let dbClient: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = postgres(getDatabaseUrl(), {
      max: 1,
      prepare: false,
    });
  }

  return queryClient;
}

export function getDb() {
  if (!dbClient) {
    dbClient = drizzle(getQueryClient(), { schema });
  }

  return dbClient;
}
