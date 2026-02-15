import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "operator", "admin"]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "open",
  "in_progress",
  "resolved",
]);
export const incidentSeverityEnum = pgEnum("incident_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey(),
  role: userRoleEnum("role").notNull().default("user"),
  githubUsername: text("github_username"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    status: incidentStatusEnum("status").notNull().default("open"),
    severity: incidentSeverityEnum("severity").notNull(),
    impact: text("impact"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    reporterId: uuid("reporter_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("incidents_status_idx").on(table.status),
    index("incidents_severity_idx").on(table.severity),
    index("incidents_started_at_idx").on(table.startedAt),
    index("incidents_updated_at_idx").on(table.updatedAt),
    index("incidents_reporter_id_idx").on(table.reporterId),
  ],
);

export const incidentDocuments = pgTable(
  "incident_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    contentJson: jsonb("content_json").notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedBy: uuid("updated_by"),
  },
  (table) => [
    uniqueIndex("incident_documents_incident_id_key").on(table.incidentId),
    index("incident_documents_updated_by_idx").on(table.updatedBy),
  ],
);
