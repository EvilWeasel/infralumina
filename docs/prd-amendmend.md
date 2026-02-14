# PRD – Infra Lumen (BlockNote AI–Aligned Architecture)

This revision replaces the custom “incident-specific intermediate schema → deterministic composer” approach with a hybrid model that directly incorporates the BlockNote AI architecture described in the research reports.

Key change:

- We DO NOT design our own document plan schema for narrative content.
- We USE BlockNote AI (`@blocknote/xl-ai`) as the canonical document-editing interface.
- We USE Vercel AI SDK structured outputs ONLY for database field extraction.

This aligns the PRD with the conclusions in the refined research report.

---

# 1. Core Principle

Two distinct AI responsibilities:

1. Structured extraction → Database fields (title, system, severity, etc.)
2. Free-form document generation/editing → BlockNote AI tools

These must be architecturally separated.

We do not mix them into one custom intermediate schema.

---

# 2. AI Create Incident (Revised Workflow)

## Entry Point

Location: Incident list view
Button: “Create with AI”

UI: Modal or sheet with free-form chat/text input

User can paste:
- Email
- Slack thread
- Problem statement
- Raw notes

---

## 2.1 Step 1 – Structured Field Extraction (Deterministic)

Server Action:

- Call `generateText` with `output: Output.object({ schema })`
- Extract ONLY required DB fields

Minimal required DB fields for creation:

- title (required)
- affected_system (required)
- severity (default medium if uncertain)
- started_at (default now)

Optional fields:
- impact
- reporter
- environment

This step is strictly structured output.

No document creation yet.

If required fields are missing:
- Return follow-up form
- User fills missing values

Only after required DB fields exist:

→ Create incident row
→ Create empty document row

---

## 2.2 Step 2 – Narrative Document Generation (BlockNote AI)

This is where the architectural correction happens.

We DO NOT:
- Ask the LLM to emit BlockNote JSON
- Create our own narrative schema

We DO:

Use BlockNote AI (`@blocknote/xl-ai`) to generate the incident document.

### Implementation Pattern

After incident + empty document row exist:

1. Instantiate BlockNote editor (client-side)
2. Pre-seed with optional template skeleton (BlockNote JSON)
3. Invoke AI via BlockNote AI extension:

   invokeAI({
     userPrompt: "Convert the following input into a structured incident report...",
     useSelection: false,
     streamToolsProvider: aiDocumentFormats.html.getStreamToolsProvider({
       defaultStreamTools: {
         add: true,
         update: true,
         delete: true
       }
     })
   })

The model receives BlockNote tools.
It issues tool calls.
The extension applies them.

No custom composer.
No manual JSON generation.

---

## 2.3 Accept / Reject Flow

BlockNote AI already supports:

- acceptChanges()
- rejectChanges()

User must explicitly Accept.

On Accept:

→ Save snapshot revision
→ Update document.current_blocks

On Reject:

→ Discard AI changes

This directly leverages BlockNote AI’s review state machine.

---

# 3. AI Restructure / Improve (Incident Detail Page)

Inside existing document editor.

User clicks:
- “AI: Improve Document”

We call:

invokeAI({
  userPrompt: "Improve clarity and structure...",
  useSelection: false
})

BlockNote AI handles:
- Streaming
- Tool calls
- Edit operations
- Review state

We do not define headings.
We do not define timeline schema.
We do not enforce structure.

Templates can be injected as guidance via prompt.

---

# 4. Templates (Revised Strategy)

Templates are stored as BlockNote JSON.

Two usage patterns:

1. Prompt guidance only
2. Pre-seeded document skeleton

The AI is allowed to delete unused sections.

We never hardcode structure in TypeScript.

---

# 5. Document Storage and Revision Safety (Updated per Revisions Research)

BlockNote JSON snapshots.

## 5.1 Storage Format

- Persist **only** BlockNote JSON (`editor.document`) for documents.
- Revisions store full JSON snapshots (no deltas in Phase 0).

## 5.2 Revision Creation Semantics

Two persistence layers:

1) **Draft autosave** (debounced): updates `documents.current_blocks` only.
2) **Explicit Save / Accept AI Changes**: inserts an immutable row in `document_revisions`.

This avoids “revision explosion” while preserving recovery guarantees.

## 5.3 Immutability Requirements (Revision-Safe)

`document_revisions` is **append-only**.

- No UPDATE or DELETE allowed on revision rows (enforce at DB boundary via privileges/triggers).
- Admin “purge” (if implemented later) is a separate, explicit operation.

## 5.4 Restore Semantics (Copy-on-Restore)

Restore must **create a new revision row** whose snapshot equals the selected historical revision.

- Do **not** repoint `current_revision_id` to an old revision directly.
- New row has `reason = "restore"` and may include `restored_from_revision_id`.

This keeps history immutable and makes the restore action auditable.

## 5.5 Delete Semantics (Trash + Purge)

Deletes are non-destructive by default:

- `documents.deleted_at` / `deleted_by` (optional: `delete_reason`).
- Default queries hide deleted documents.
- Admin Trash view supports restore.
- Optional later: Admin-only “purge” that permanently deletes a document and/or its revisions.

## 5.6 Retention Policy (Documented, not necessarily enforced in Phase 0)

Revision history will grow.

Phase 0 default: keep all revisions.

Phase 1 option: introduce retention rules (e.g., keep last N revisions per doc, or keep revisions for at least X days) and expose purge as an admin maintenance action.

## 5.7 Concurrency Protection

Use optimistic concurrency for saves:

- `documents.lock_version` integer
- Save/Accept operations require `expected_lock_version`.

Optional (Postgres-specific) future enhancement:
- Use `xmin` as a concurrency token.

## 5.8 Audit Events (Optional but Recommended)

Add an application-level, append-only audit/event log for high-value actions:

- `incident_created`
- `document_revision_created` (manual save / AI accept)
- `document_restored`
- `document_trashed` / `document_restored_from_trash`
- `document_purged` (if supported)

This complements revision content history without replacing it.

# 6. Why This Is Architecturally Cleaner

The previous PRD mixed:
- DB extraction
- Narrative structuring
- BlockNote composition

The refined architecture separates:

Structured extraction → AI SDK structured output

Document editing → BlockNote AI tool system

This matches the refined research report conclusions.

It avoids building a parallel document DSL that competes with BlockNote’s own tool system.

---

# 7. Licensing Consideration

BlockNote AI (`@blocknote/xl-ai`) is XL-licensed.

Decision required:

- Internal-only use → acceptable after review
- Closed-source commercial product → requires commercial license

If licensing becomes a blocker:

Fallback path:
- Implement custom BlockNote toolset via AI SDK tools

But Phase 0 should use BlockNote AI directly.

---

# 8. Updated Phase 0 Definition of Done

- AI Create:
  - Structured DB extraction via Output.object
  - Follow-up for missing required fields
  - BlockNote AI generates document
  - Accept required before save

- AI Improve:
  - Uses BlockNote AI invokeAI
  - Accept/Reject flow

- No custom intermediate document schema
- No manual BlockNote JSON composition

---

# 9. Final Architectural Position

Infra Lumen uses:

- Vercel AI SDK for structured extraction
- BlockNote AI for document generation and iterative editing
- Immutable revision snapshots for durability

This keeps the system minimal, extensible, and aligned with the research conclusions.

