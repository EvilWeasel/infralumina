import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { canWriteIncidents } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getDefaultAiModel } from "@/lib/ai/provider";

export const runtime = "nodejs";

type BlockNoteAiRequestBody = {
  messages?: UIMessage[];
  toolDefinitions?: Parameters<typeof toolDefinitionsToToolSet>[0];
};

function buildSystemPrompt() {
  return [
    aiDocumentFormats.html.systemPrompt,
    "You are assisting with IT incident documentation.",
    "Prioritize clarity, factual accuracy, and concise operational language.",
    "Operate on the provided selection and produce one coherent final structure.",
    "Prefer updating and deleting existing blocks over introducing new parallel sections.",
    "Do not duplicate existing document structures or prepend a second template.",
    "Target structure: Summary, Impact, Timeline, Investigation, Mitigation/Resolution, Follow-ups.",
    "Do not invent concrete facts that are missing.",
  ].join("\n\n");
}

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthenticatedUser();

    if (!canWriteIncidents(authContext.profile.role)) {
      return Response.json({ error: "Write access required" }, { status: 403 });
    }

    const body = (await request.json()) as BlockNoteAiRequestBody;
    const incomingMessages = body.messages;

    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return Response.json({ error: "Missing messages in request body" }, { status: 400 });
    }

    const toolDefinitions: Parameters<typeof toolDefinitionsToToolSet>[0] =
      body.toolDefinitions ?? {};
    const tools = toolDefinitionsToToolSet(toolDefinitions);
    const modelMessages = await convertToModelMessages(
      injectDocumentStateMessages(incomingMessages),
    );

    const result = streamText({
      model: getDefaultAiModel(),
      system: buildSystemPrompt(),
      messages: modelMessages,
      tools,
      toolChoice: "required",
      temperature: 0,
      maxRetries: 1,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error in BlockNote AI route";

    return Response.json({ error: message }, { status: 500 });
  }
}
