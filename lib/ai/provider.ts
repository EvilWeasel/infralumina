import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const defaultLocalModel = "qwen2.5-3b-instruct-q4_k_m.gguf";
const defaultLocalBaseUrl = "http://localhost:8080/v1";

const localProvider = createOpenAICompatible({
  name: "local-llm",
  apiKey: process.env.LOCAL_LLM_API_KEY ?? "local-dev",
  baseURL: process.env.LOCAL_LLM_BASE_URL ?? defaultLocalBaseUrl,
  supportsStructuredOutputs: false,
});

export function getStructuredOutputModel() {
  const modelName = process.env.LOCAL_LLM_MODEL ?? defaultLocalModel;
  return localProvider(modelName);
}
