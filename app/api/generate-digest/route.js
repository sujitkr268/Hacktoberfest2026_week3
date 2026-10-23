import { buildDigestPrompt, callModel, extractJson, resolveProviderConfig, validateDigest } from "@/lib/ai";
import { NextResponse } from "next/server";

/**
 * POST /api/generate-digest
 * Body: { messages: string, apiKey?: string, baseUrl?: string, model?: string }
 *
 * The AI key and inference requests stay entirely server-side: browsers never
 * receive the secret unless the user temporarily typed one into the in-memory
 * Model Settings modal (same pattern as week 1).
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const messages = typeof body?.messages === "string" ? body.messages.trim() : "";

  if (messages.length < 40) {
    return NextResponse.json(
      {
        error:
          "Add a few more messages first — paste (or load) at least a small chunk of your chat log.",
      },
      { status: 400 }
    );
  }

  const config = resolveProviderConfig({
    apiKey: body?.apiKey,
    baseUrl: body?.baseUrl,
    model: body?.model,
  });

  if (!config) {
    return NextResponse.json(
      {
        error:
          "No model configured yet. Add a GROQ_API_KEY (or AI_API_KEY + AI_BASE_URL) to your .env.local, run a local Ollama server, or open Model Settings and enter a key.",
      },
      { status: 400 }
    );
  }

  const { system, user } = buildDigestPrompt(messages);

  try {
    const content = await callModel({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      system: system,
      user: user,
    });

    const digest = validateDigest(extractJson(content));
    return NextResponse.json({ digest: digest, model: config.model, provider: config.label });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong while digesting." },
      { status: 502 }
    );
  }
}
