import type { AIConfig } from "./types";

export type ProviderId = AIConfig["provider"];

export type ModelOption = {
  id: string;
  label: string;
  note?: string;
};

export type ProviderSpec = {
  id: ProviderId;
  label: string;
  short: string;
  hint: string;
  endpoint?: string;
  keyUrl?: string;
  keyPrefix?: string;
  models: ModelOption[];
  /** Free-text model ids are allowed (e.g. a model newer than this build). */
  allowCustomModel?: boolean;
};

/**
 * Groq serves an OpenAI-compatible chat-completions API, so no SDK is needed.
 * Only the text/code models are offered here — prompt-guard, TTS and Whisper
 * endpoints use different request shapes and are not chat models.
 */
export const GROQ_MODELS: ModelOption[] = [
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", note: "flagship MoE, strongest reasoning" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", note: "low latency, fast text & code" },
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B", note: "high-efficiency multilingual" },
];

export const GEMINI_MODELS: ModelOption[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "primary general-purpose" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", note: "fastest, lowest cost" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", note: "high cost-efficiency" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)", note: "deep multi-step reasoning" },
  { id: "gemini-pro-latest", label: "Gemini Pro (latest)", note: "tracks the newest Pro" },
  { id: "gemini-flash-latest", label: "Gemini Flash (latest)", note: "tracks the newest Flash" },
  { id: "gemini-flash-lite-latest", label: "Gemini Flash Lite (latest)", note: "lightest general model" },
];

export const OPENAI_MODELS: ModelOption[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", note: "cheap, reliable" },
  { id: "gpt-4o", label: "GPT-4o", note: "strong multimodal" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", note: "fast" },
];

export const OPENROUTER_MODELS: ModelOption[] = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
];

export const PROVIDERS: ProviderSpec[] = [
  {
    id: "local",
    label: "Built-in engine",
    short: "Axiom",
    hint: "Offline · no key · 109 exam plots",
    models: [],
  },
  {
    id: "groq",
    label: "Groq",
    short: "Groq",
    hint: "Very fast inference · OpenAI-compatible",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    keyUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
    models: GROQ_MODELS,
    allowCustomModel: true,
  },
  {
    id: "gemini",
    label: "Google AI Studio",
    short: "Gemini",
    hint: "Gemini models via the OpenAI-compatible endpoint",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AIza",
    models: GEMINI_MODELS,
    allowCustomModel: true,
  },
  {
    id: "openai",
    label: "OpenAI",
    short: "OpenAI",
    hint: "api.openai.com",
    endpoint: "https://api.openai.com/v1/chat/completions",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    models: OPENAI_MODELS,
    allowCustomModel: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    short: "OpenRouter",
    hint: "Many models behind one key",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    keyUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    models: OPENROUTER_MODELS,
    allowCustomModel: true,
  },
  {
    id: "custom",
    label: "Custom endpoint",
    short: "Custom",
    hint: "Any OpenAI-compatible chat API",
    models: [],
    allowCustomModel: true,
  },
];

export const providerById = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<ProviderId, ProviderSpec>;

export function defaultModel(provider: ProviderId) {
  return providerById[provider]?.models[0]?.id ?? "";
}
