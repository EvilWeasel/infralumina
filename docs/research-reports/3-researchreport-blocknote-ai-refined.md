# Reevaluating Infra Lumen’s AI → BlockNote Strategy  
## Moving from “incident-specific intermediate schema” to a **generic, free-form, spec-adherent** BlockNote editing interface

## Executive summary

You are correct to challenge the “incident-specific doc plan → deterministic composer → fixed headings/timeline” approach. It optimizes for predictability but conflicts with your long-term vision: a **general-purpose AI agent that can iteratively edit any BlockNote document**, optionally guided by user templates—without imposing a rigid structure.

The good news: **BlockNote AI already implements the generic interface you want**—tool-based, streaming, iterative BlockNote editing with Accept/Reject flows and selection-aware editing. BlockNote explicitly states that its AI feature (`@blocknote/xl-ai`) is built on the Vercel AI SDK, is model-agnostic, supports human-in-the-loop workflows, and is “completely customizable.” citeturn4view0turn0view0turn1view0turn2view0

So the “best change” is not to invent a new generic composer from scratch—at least not for **in-editor** AI. Instead:

- Use **BlockNote AI (xl-ai)** as the canonical **generic in-editor AI interface** (free-form, tool-driven, streaming edits, Accept/Reject). citeturn0view0turn1view0turn2view0turn7view1  
- Use **Vercel AI SDK structured outputs** for the **non-editor** parts where you need deterministic structured data (incident DB fields, classification), and for “Create with AI” flows you can either:
  - run a headless/hidden editor with BlockNote AI to generate the draft doc, or
  - implement a small **generic BlockNote patch/ops tool** yourself (operations like insert/update/delete/replace) executed deterministically server-side.

This split keeps you free-form where you want freedom (document editing), and deterministic where you need correctness (DB fields and non-interactive ingestion).

A key constraint: **BlockNote AI is an XL package** with copyleft licensing and commercial licensing rules for closed-source usage; BlockNote’s pricing page and AI docs describe the dual-license model for XL features (AI, exporters, etc.). citeturn4view0turn4view1turn4view2 (Not legal advice—just highlighting the licensing facts.)

## What BlockNote AI already gives you that matches your desired “generic AI document editor”

### It is explicitly designed as a generic AI-to-document modification layer

BlockNote AI’s “Getting Started” shows the architecture:

- Install `@blocknote/xl-ai`. citeturn0view0  
- Enable the AI extension (`AIExtension`) in the editor. citeturn0view0turn2view0  
- Add UI elements like the AI menu controller in the editor, plus toolbar button and slash menu entries. citeturn7view2  
- Set up a backend route using Vercel AI SDK `streamText` that injects document state and passes tool definitions to the model, with a BlockNote system prompt describing how to modify the document. citeturn0view0turn7view0turn7view2  

Most importantly, the BlockNote AI backend integration doc states:

- the model receives “BlockNote tools” (from `toolDefinitions`), and  
- “tool calls are forwarded to the client application where they’re handled automatically by the AI Extension.” citeturn7view0  

That means the model **doesn’t need to output BlockNote JSON**. It issues tool calls that represent edits, which the extension applies to the editor.

This is the generic tool interface you were aiming to design—BlockNote already ships it.

### It has built-in Accept/Reject and “review” UX primitives

The AI reference exposes that the `AIExtension` instance supports:

- `acceptChanges()` and `rejectChanges()`  
- `abort()` and `retry()`  
- a store containing AI menu state transitions like `user-input`, `thinking`, `ai-writing`, `user-reviewing`, etc. citeturn7view1turn2view0  

This matches your requirement: operators aren’t burdened with revisioning workflows, but when AI makes changes, the UI naturally supports review and decision.

### It supports selection-aware edits and “restrict edit operations” per command

The Custom AI Commands page demonstrates a per-command call:

- `invokeAI({ userPrompt, useSelection, streamToolsProvider })` to run an AI command. citeturn7view3turn2view0  
- `streamToolsProvider` can be configured so only certain operations are permitted. In the example, they disable add/delete and allow only update. citeturn7view3turn7view1  
- It uses `aiDocumentFormats.html.getStreamToolsProvider({ defaultStreamTools: { add, delete, update }})`. citeturn7view3turn7view1  

This precisely addresses your “iterative modifications” vision:
- “turn this paragraph into a list” (update + maybe add/delete)  
- “remove this section” (delete)  
- “rewrite selected text” (update only)  
- “insert a new section here” (add)

All without hardcoding a document outline.

### It can be invoked from contexts beyond the default AI menu

BlockNote AI reference calls out advanced APIs intended exactly for “chat UI outside the menu” scenarios:

- `sendMessageWithAIRequest` is recommended “when you need to manually call the LLM without updating the state of the BlockNote AI menu,” e.g., “a chat window.” citeturn2view0  
- `buildAIRequest` assembles the `AIRequest` from editor state and can be used when you bypass `invokeAI`. citeturn2view0  

So you can implement your own “code-editor-like chat panel” and still reuse BlockNote’s document-state serialization and tool streaming.

## How to incorporate templates without imposing structure

You want templates to *guide* the AI without imposing structure when it isn’t appropriate.

There are two strong ways to do that with BlockNote AI + AI SDK:

### Template as a prompt/style guide (recommended for Phase 0)

Instead of forcing a fixed intermediate schema, treat the template as an “editorial style guide”:

- Store a template as **BlockNote JSON** in your DB (BlockNote recommends JSON as lossless). citeturn25view0  
- When the user runs an AI command (e.g., “Convert this email into an incident report”), you inject the template as contextual guidance in the user prompt or as an appended “Template Guidance” block.

BlockNote specifically notes you can override or extend the system prompt, but must keep it explaining how to modify the document. citeturn7view2turn0view0  
Practically, you should **not** change the core system prompt too aggressively. Put templates into the user prompt (or as additional messages) to keep the tool-calling instructions intact.

Template guidance pattern:

- “Use the following template as an example of headings and writing style. You may omit sections that are not relevant. Do not invent timeline structure unless the source text implies timed events.”

This preserves freedom.

### Template as a pre-seeded document (often best UX)

For “Create with AI,” you can create a new incident document prefilled with a template skeleton (as blocks), then ask the AI to fill/adjust. This lets the AI delete/modify sections as needed (not forced), especially if you enable `delete` in stream tools. citeturn7view3turn7view1  

This also gives the user something concrete to preview while streaming.

## How to implement the generic AI editing interface with Vercel AI SDK

You have two viable architectural approaches, depending on whether you want to adopt BlockNote AI as a dependency.

### Approach using BlockNote AI (preferred for in-editor “agentic” UX)

This is the most direct match to what you described: streaming edits, tool calls, and a Notion-style in-editor AI.

#### Client-side (editor)

- Register the AI extension (`AIExtension`) in `useCreateBlockNote(...)`. citeturn0view0turn2view0  
- Provide a transport like `DefaultChatTransport` pointing at a backend endpoint. citeturn0view0turn7view2  
- Add the UI controllers (AI menu, toolbar button, slash menu items). citeturn7view2turn0view0  
- Use custom commands to your liking (e.g., “Transform into incident report”), calling `invokeAI({ userPrompt, useSelection, streamToolsProvider })`. citeturn7view3turn2view0  

#### Backend route (AI SDK streamText)

BlockNote’s docs provide the canonical pattern:

- Receive `{ messages, toolDefinitions }`  
- Inject document state into messages via `injectDocumentStateMessages`  
- Convert tool definitions into AI SDK tools via `toolDefinitionsToToolSet`  
- Use `aiDocumentFormats.html.systemPrompt` so the model understands how to edit the document  
- `toolChoice: "required"` to ensure tool usage citeturn0view0turn7view0turn7view2  

This approach is fundamentally “free-form but spec-adherent” because the model edits through BlockNote tools rather than generating doc JSON.

#### How this solves your complaint about the fixed intermediate schema

You no longer define “timeline,” “summary,” etc. in the schema. The AI uses tools to modify blocks based on:
- the content in the document
- the user prompt
- optional template guidance
- the allowed operations (add/update/delete) you configure per command citeturn7view3turn7view1  

### Approach without BlockNote AI: build a generic “BlockNote Ops” toolset in AI SDK

If you choose not to use `@blocknote/xl-ai` (licensing concerns, dependency size, or you want full control), you can still implement a generic interface—just at a lower level.

This “generic intermediate schema” is not incident-specific; it’s “document ops.”

#### Why this is valid in AI SDK

AI SDK defines tools as objects with:
- `inputSchema` (Zod/JSON schema; validated for tool calls)
- optional `execute` (or omitted if you forward tool calls to client/queue)
- optional `strict: true` for providers that support strict tool calling citeturn6view0  

So you can define tools like:

- `bn_insertBlocks`
- `bn_updateBlock`
- `bn_removeBlocks`
- `bn_replaceBlocks`
- `bn_moveBlock` (optional)

and then execute them deterministically against a document structure.

You already have the BlockNote “manipulating content” APIs that match these ops (insert/update/remove/replace) when operating in a real editor instance. In a server-only context, you would implement the op executor on JSON blocks, not on a live editor.

This is generic and template-friendly.

#### Tradeoffs vs BlockNote AI
- Pro: Works server-side; easy “Create with AI” from an incident table without instantiating an editor; avoids XL dependency.
- Con: You reimplement what BlockNote already built: streaming UX, accept/reject state, document-state serialization for the model, and robust tool prompts.

## Evaluating whether BlockNote AI covers both your use cases

### Inline editor “chat-based refactor” use case
**Yes—BlockNote AI is exactly designed for this.**  
It provides selection-aware edits, tool-based doc modifications, and built-in accept/reject. citeturn7view3turn7view1turn2view0  

You can implement:
- “Rewrite selection in a formal tone” (`update` only) citeturn7view3  
- “Convert these paragraphs into a bullet list” (allow add/update/delete)
- “Remove this section” (`delete` allowed)
- “Insert a summary section above” (`add` allowed)

### Incident table “Create with AI from email” use case
**Partially—BlockNote AI provides the document generation mechanism, but not the incident DB extraction workflow by default.**

What BlockNote AI gives you for this scenario:
- A streaming pipeline where the model can add blocks into an empty or templated document. citeturn0view0turn1view0turn2view0  
- You can “invoke AI” with a prompt like “Convert this email into an incident report” and allow `add` operations. The custom commands example shows how to enable add-only behavior. citeturn7view3turn7view1  

What it does not explicitly provide out-of-the-box:
- A schema for extracting incident DB fields (title/severity/status/impact) as validated structured data.

**Recommendation:** Use a two-step pipeline:
1) AI SDK structured extraction (`generateText` + `Output.object`) for structured DB fields (stable, validated). AI SDK explicitly documents that schema-based structured generation is supported via `output` and should be validated because models can be incorrect/incomplete. citeturn22view0  
2) BlockNote AI doc generation/editing for the narrative report blocks (free-form), guided by templates if desired.

This gives you the best of both worlds: correctness for DB fields + freeform document creation.

## Licensing reality check for BlockNote AI (XL)

BlockNote’s AI feature is an **XL package** and is described as “fully open source” but under a copyleft license, with a commercial license for closed-source/proprietary usage as part of a Business subscription. citeturn4view0turn4view1  
BlockNote’s pricing page also states XL features (including AI) are dual-licensed under GPL-3.0 or a commercial license for closed-source applications. citeturn4view1turn4view2  

This doesn’t kill the idea, but you should consciously choose:
- If Infra Lumen remains private/internal: consult legal on GPL-3 implications for internal use and distribution boundaries (not legal advice).
- If you plan to publish Infra Lumen publicly as OSS: GPL-3 becomes simpler to comply with.
- If you want Infra Lumen closed-source / potential commoditization: you may prefer building a non-XL AI pipeline or budgeting for licensing.

## Bottom-line recommendation

Given your clarified goals, the best architecture is:

- **For generic “AI edits a BlockNote document iteratively”: adopt BlockNote AI (`@blocknote/xl-ai`)**. It already implements tool-based, free-form, streaming, accept/reject editing, selection context, and per-command operation restrictions—exactly the “generic interface” you asked for. citeturn0view0turn7view0turn7view1turn7view3turn2view0  
- **For “Create Incident with AI”: combine AI SDK structured extraction for DB fields with BlockNote AI for the narrative doc**, optionally using a template as guidance rather than a forced structure. citeturn22view0turn7view3turn25view0  
- Keep your revision-safe storage unchanged: snapshot revisions of BlockNote JSON remain robust and align with BlockNote’s explicit recommendation to store BlockNote JSON (`editor.document`) as lossless/durable. citeturn25view0  

If you later want to remove XL dependency, you can implement your own generic “BlockNote ops toolset” using AI SDK tool calling (schemas + optional strict mode) and a deterministic executor—but that should be a deliberate second phase, because BlockNote AI already ships what you’re about to build. citeturn6view0turn4view0