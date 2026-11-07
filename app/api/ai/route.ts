import { NextResponse } from "next/server";
import { runEngine } from "@/lib/engine";
import { callLLM } from "@/lib/llm";
import type { AIConfig, EngineContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  prompt?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: EngineContext;
  engine?: AIConfig;
};

export async function POST(request: Request) {
  const started = Date.now();
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").toString().slice(0, 2000).trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const localResponse = runEngine(prompt, body.context ?? {});

  const engine = body.engine;
  const wantsLLM = engine && engine.provider !== "local" && engine.apiKey;
  const hasEnvLLM =
    process.env.AI_PROVIDER &&
    process.env.AI_PROVIDER !== "local" &&
    (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);

  if (wantsLLM || hasEnvLLM) {
    try {
      const result = await callLLM({
        prompt,
        history: body.history,
        context: body.context,
        engine,
      });
      if (!result.content.trim()) throw new Error("Empty LLM response");
      return NextResponse.json({
        content: result.content,
        artifacts: result.artifacts,
        followUps: result.followUps.length ? result.followUps : localResponse.followUps,
        meta: { source: "llm", model: result.model, latency: Date.now() - started },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed";
      return NextResponse.json({
        content:
          localResponse.content +
          `\n\n> **Engine note** — the connected LLM could not be reached (${message.slice(0, 140)}). This answer was rendered by the built-in Axiom engine instead.`,
        artifacts: localResponse.artifacts,
        followUps: localResponse.followUps,
        meta: { source: "local", model: "Axiom Engine v2", latency: Date.now() - started },
      });
    }
  }

  return NextResponse.json({
    content: localResponse.content,
    artifacts: localResponse.artifacts,
    followUps: localResponse.followUps,
    meta: { source: "local", model: "Axiom Engine v2", latency: Date.now() - started },
  });
}
