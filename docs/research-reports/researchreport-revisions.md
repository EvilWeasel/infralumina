# Revision-Safe Document Storage and Restore Patterns for Infra Lumen

## Context and requirements you described

You’re building an internal ITSM platform (Infra Lumen) where “revision safety” means two things at once:

First, every meaningful edit to a document should leave behind an **older version that can be restored** later—without making “versioning” a workflow for operators. Operators should just edit and hit save; the system quietly records a revision. The *process* only becomes relevant when something goes wrong and an **administrator needs to recover content**.

Second, destructive actions (especially **deletes**) should be **non-destructive by default**. A delete should remove the item from normal UI, but it must be recoverable (a “trash / recycle bin” model). Only a special admin action should permanently purge content.

You also have a specific editor constraint: documents are stored as **BlockNote JSON**, and BlockNote itself recommends using BlockNote JSON (`editor.document`) as the most durable, lossless storage format. citeturn8view4 This strongly influences which revisioning approaches are practical.

Your PRD currently sketches a simple model: a `documents` table and a `document_revisions` table (admin can revert). That’s already in the direction most mature systems take, but the “best” approach depends on how far you want to push (tamper evidence, delta storage, DB-managed history, etc.).

## What mature products and libraries do in practice

### Wiki-style “every edit creates a revision row” (MediaWiki)

MediaWiki is a long-running reference point for robust revision history at scale. Its core model is: **every edit creates a new revision row**. The `revision` table holds metadata “for every edit” and “every edit creates a revision row,” including user/timestamp and other metadata. citeturn7view3

For deletion, MediaWiki doesn’t treat deletion as “row is gone”; instead it uses an **archive model**. When a page is deleted, revisions move from the live revision table into an **archive table**, and administrators can later undelete/restore via tooling. citeturn5search0turn5search6 This is exactly aligned with your “non-destructive deletes” requirement.

Two takeaways that map cleanly to Infra Lumen:

- “Revision per save” is a proven, scalable mental model. citeturn7view3  
- “Delete” can be implemented as archival/soft-delete, not destruction; restore is a first-class admin action. citeturn5search0

### Knowledge tools “restore creates a new version” (Confluence)

Confluence’s version history has a subtle but important behavior: when you restore an older version, “all page history is retained” and **restoring creates a copy of that version** which becomes the new current version. citeturn8view0

This pattern is extremely relevant for “auditability” because it avoids altering history. Instead of pointing “current” back to an old row (which can look like rewriting history), you create a new revision whose content equals the restored version—so the act of restoration itself is recorded as a new event.

Confluence also uses a “trash” pattern: deleting moves content to a space trash where it can be restored by admins until it is purged. citeturn8view1

Takeaways:

- **Copy-on-restore** is an industry pattern that preserves an immutable history. citeturn8view0  
- **Trash + purge** cleanly separates “delete from UI” vs “delete forever.” citeturn8view1

### App-layer “versions table” (PaperTrail, django-reversion)

For classic CRUD apps (not wiki pages), the dominant approach is: keep current state in the main table and write versions to a separate *immutable* table.

PaperTrail (Rails) widely demonstrates the simplest form: you “add a `versions` table” and models gain a `versions` association (history of changes). citeturn8view3

django-reversion explicitly lists the features you want: “roll back to any point in a model instance’s history” and “recover deleted model instances,” with strong admin integration. citeturn8view2

Takeaways:

- “Current row + versions table” is mainstream and boring (in a good way). citeturn8view3turn8view2  
- Recovery of deleted records is typically implemented as either soft-delete + versions or archival + versions; the admin tooling is key. citeturn8view2

### Retention controls are common (BookStack, Confluence)

Revision history grows forever unless you impose limits. BookStack documents that “each time a page is saved a revision is stored” and it **automatically removes revisions** per page after a configured limit (default 100) to prevent DB bloat. citeturn9search1 Confluence also supports retention rules (and warns that deleting a specific version is permanent). citeturn8view0

Takeaway: even if you want “revision safety,” you should decide (and document) a retention policy—especially if documents are large JSON. citeturn9search1turn8view0

## Design options for Infra Lumen

Below are the main strategies teams choose for “revision safety,” moving from simplest to most sophisticated. All can satisfy your UX requirements (“operators don’t think about revisions”), but they have different complexity and operational burdens.

### Snapshot-per-save revision table (app-managed)

**How it works**
- You store the “current” document in `documents` (or a `document_current` column).
- On every save, you **insert** a new row into `document_revisions` containing a full snapshot of the BlockNote JSON.
- You update the “current pointer” (e.g., `documents.current_revision_id`).

**Why teams choose it**
- Very common (PaperTrail/django-reversion style). citeturn8view3turn8view2  
- Natural fit for BlockNote JSON, since BlockNote explicitly recommends storing its JSON as the durable, lossless format. citeturn8view4  
- Restoration is trivial: set current to an old snapshot (or better: copy-on-restore, see below).

**Main downsides**
- Storage usage: full JSON per save can be large.
- Diffs require computation (you can compute on demand, or store derived diffs later).

### Delta/patch-based revision storage (store only changes)

**How it works**
- Instead of storing full JSON each time, you store deltas: JSON Patch, ProseMirror “steps,” or some editor operation log.

**Why teams choose it**
- Better storage efficiency for large docs.
- Can support fine-grained audit trails.

**Downsides and why it’s often not worth it early**
- You now need a reliable rehydration pipeline: reconstruct current document by replaying patches (and handle corrupted sequences).
- “Restore old version” might require replaying from the beginning or from snapshots + deltas.
- For ProseMirror, reverting old steps can require **rebasing inverted steps over intermediate steps**, which is non-trivial. citeturn3search3  
- The complexity is closer to building a mini VCS than an ITSM feature.

This option makes sense only if you have very large documents, extremely frequent saves, or need deep audit semantics per keystroke/operation.

### Database-managed history tables (temporal/system-versioned tables)

**How it works**
- The database automatically archives old rows into a history table as the result of UPDATE/DELETE operations.
- Example: the `temporal_tables` Postgres extension supports “system-period data versioning” where old rows are archived into a history table. citeturn7view1

**Why teams choose it**
- Centralized, “you can’t forget to version,” because the DB does it.
- “Time travel” queries become possible (what did the row look like at time T). citeturn7view1turn1search4  

**Downsides in your stack**
- Extensions like `temporal_tables` are not guaranteed to exist in managed DB environments; Supabase supports a curated set of extensions, and custom extensions are constrained for stability/security. citeturn6search0turn6search2  
- Even if you implement it with triggers, you still need an application-level “revisions UI” (list, restore, audit) and rules for retention.
- Temporal history is great for general row versioning, but for *documents* you’ll still archive full JSON blobs each time (similar storage costs to snapshot-per-save).

### Event sourcing / append-only event log (event store + projections)

**How it works**
- Instead of storing state as rows you mutate, you store “all changes” as “a sequence of events” and reconstruct state from events (or maintain projections). citeturn0search3turn0search11  

**Why teams choose it**
- Maximum audit fidelity: history is first-class, not an add-on.
- Reconstruction of past states is built into the model. citeturn0search3  

**Downsides**
- Higher conceptual and implementation complexity.
- Requires building and maintaining projections/read-models.
- Overkill for an internal ITSM-doc tool unless you have stronger regulatory/audit constraints.

A hybrid exists: use normal tables for current state, but additionally write an append-only “events/audit log” (see recommendation below).

## Recommendation that best matches your PRD and constraints

Given your requirements (low friction for operators, easy admin restore, non-destructive deletes, BlockNote JSON storage, Postgres/Supabase stack), the best default approach is:

### Adopt “immutable snapshot revisions + copy-on-restore + trash/soft-delete + audit events”

This is essentially combining the best proven parts of Confluence + wiki patterns + standard “versions table” libraries:

- **On each save**: insert a new immutable revision row (snapshot of BlockNote JSON). This matches common library patterns and BlockNote’s recommended storage format. citeturn8view3turn8view4  
- **On restore**: follow Confluence’s approach—restoring creates a **new current revision that is a copy** of the old one—so the restoration itself becomes a recorded change, preserving the historical chain. citeturn8view0  
- **On delete**: implement as a trash/soft-delete (deleted items hidden by default, restorable by admin), mirroring Confluence’s trash and MediaWiki’s non-destructive archival mindset. citeturn8view1turn5search0  
- **For auditing “who did what”**: keep an app-level audit trail, and optionally enable DB-level audit logging via pgAudit in Supabase if you want query-level logging (but don’t confuse statement logs with revision history). Supabase documents pgAudit enablement/config and its modes. citeturn7view2turn6search1  

This gives you the best “product behavior” with the least engineering risk, and it stays compatible with a later Diff view and more advanced history management.

## Proposed implementation blueprint for Infra Lumen

### Data model that supports the above cleanly

A robust schema (conceptual) for documents:

**documents**
- `id`
- `title`
- `parent_id` (for future recursive docs)
- `current_revision_id` (FK → document_revisions.id)
- `created_at`, `created_by`
- `updated_at`, `updated_by`
- soft delete fields: `deleted_at`, `deleted_by`, `delete_reason` (optional)

**document_revisions** (immutable / append-only)
- `id`
- `document_id` (FK → documents.id)
- `revision_number` (monotonic per document)
- `created_at`, `created_by`
- `reason` (optional: “manual save”, “AI restructure”, “restore”, etc.)
- `content_json` (`jsonb`, BlockNote JSON snapshot)
- optional: derived fields (later): `content_plaintext`, `content_hash`, `size_bytes`

This aligns conceptually with how general versioning libraries set up separate version tables (PaperTrail/django-reversion). citeturn8view3turn8view2 And it aligns with BlockNote’s guidance to store BlockNote JSON for lossless durability. citeturn8view4  

### Make revisions truly “revision-safe” (immutability)

To claim revision safety, you must prevent revisions from being rewritten.

Implementation approaches (pick one):

- Database “append-only” policy: prohibit `UPDATE`/`DELETE` on `document_revisions` rows via triggers or privileges. (This is a standard DB practice; the report focus here is that you should enforce immutability at the DB boundary, not just in application code.)
- Application-only immutability is weaker; an accidental bug can overwrite history.

Confluence explicitly highlights that deleting specific versions can be permanent and non-restorable. citeturn8view0 If you want stronger safety than Confluence here, you can disallow revision deletion entirely (or allow only a “purge history” admin operation with explicit confirmation + retention policy).

### Copy-on-restore workflow (recommended)

When an admin restores revision N:

- Do **not** set `documents.current_revision_id = old_revision_id` directly.
- Instead:
  1) Create a new revision row **whose content_json equals** revision N.
  2) Mark it with `reason = "restore"` and `restored_from_revision_id = N` (optional).
  3) Set `documents.current_revision_id` to the new revision row.

Why this is best:
- This matches Confluence’s behavior: “restoring an older version creates a copy… the copy will become the new, current version,” while retaining all history. citeturn8view0  
- It ensures “restore” itself is visible in revision history (audit-friendly).

### Non-destructive delete workflow (trash / recycle bin)

To fulfill your “delete should be reversible” requirement, there are two proven patterns:

**Soft-delete in-place (recommended for Infra Lumen early)**
- `documents.deleted_at` is set; queries exclude deleted rows by default.
- Admin “Trash” UI lists `deleted_at is not null`.
- Restore clears `deleted_at/deleted_by`.

**Archive-table approach (more wiki-like)**
- Move document metadata to `documents_archive`, or move revisions to archive tables similar to MediaWiki’s `archive` table. MediaWiki explicitly stores deleted page info in `archive` and supports undeletion. citeturn5search0  

For your app, soft-delete is typically simpler while still achieving the same user-facing semantics as Confluence trash (“moved to trash… can be restored by admin until permanently deleted”). citeturn8view1

### Retention policy and “purge” semantics

Even if “store everything forever” sounds attractive, systems often add retention controls:

- BookStack stores a revision each time a page is saved, but removes old revisions past a limit (default 100 per page) to avoid bloat; configurable via `REVISION_LIMIT`. citeturn9search1  
- Confluence supports retention rules and treats deletion of specific versions as permanent. citeturn8view0

For Infra Lumen, a sensible default policy is:

- Keep all revisions by default (for now), **or**
- Keep last N revisions per doc (e.g., 200) and/or keep revisions for at least X days.

If you want strict revision safety, be careful with aggressive pruning. At minimum, make it an admin-only maintenance job (similar to BookStack/Confluence’s admin-configured approach). citeturn9search1turn8view0

### Concurrency and “lost updates” protection

Revision history protects you after mistakes, but it’s better to avoid overwrites.

Add optimistic concurrency:

- PostgreSQL has system columns; `xmin` “holds the ID of the latest updating transaction” and is “ideal for use as a concurrency token,” because it changes every update. citeturn4search0turn4search8  
- Alternatively maintain your own `documents.lock_version` integer.

UX impact is minimal:
- If someone saves based on an old version, you can warn: “Document changed since you opened it. Create a new revision anyway / reload.”  
- Even if you “allow anyway,” you still created a revision, so recovery remains possible.

## How this compares to your current PRD

Your PRD direction (“document_revisions table + admin revert”) is already aligned with mainstream approaches used by libraries and content products. citeturn8view3turn8view2

The gaps to close (based on the research patterns above) are:

- Define restore semantics as **copy-on-restore** (Confluence pattern). citeturn8view0  
- Make deletes explicitly **trash/soft-delete** with a restore UI (Confluence trash; MediaWiki archive/undeletion pattern). citeturn8view1turn5search0  
- Formalize retention and “purge” (BookStack revision limits; Confluence retention rules). citeturn9search1turn8view0  
- Decide whether you want DB-level auditing via pgAudit in Supabase as a supplement (statement-level visibility, not a replacement for revision content history). citeturn7view2turn6search1  
- Explicitly lean on BlockNote’s recommendation: store **BlockNote JSON snapshots** (`editor.document`), which supports a snapshot revision model strongly. citeturn8view4  

## Final recommendation summary

For Infra Lumen, the best “revision-safe” approach—balancing correctness, UX simplicity, and engineering time—is:

Use **immutable snapshot revisions** (store BlockNote JSON each save), **copy-on-restore** (restoring creates a new revision), and **trash/soft-delete** with an admin restore UI, optionally complemented by **pgAudit** for database-level auditing in Supabase. citeturn8view4turn8view0turn8view1turn6search1

This is the most proven path across wiki systems, enterprise knowledge tools, and app-layer versioning libraries, while staying aligned with your PRD and the realities of storing BlockNote documents. citeturn7view3turn5search0turn8view0turn8view3