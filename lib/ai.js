/**
 * lib/ai.js
 * -----------------------------------------------------------------------------
 * Server-side AI layer for Sloth Digest.
 *
 * Design notes (mirrors the TouchGrass week-1 architecture):
 * - Runs ONLY inside Route Handlers / server code. Never import this into a
 *   client component: API keys must stay on the server.
 * - Talks to any OpenAI-compatible chat completions endpoint, so the same code
 *   works with Groq, Together, OpenRouter, vLLM, or a local Ollama server.
 * - Asks the model for a JSON object, then validates + normalizes it at
 *   runtime: JSON mode guarantees valid syntax, not a complete schema.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const OLLAMA_BASE_URL = "http://localhost:11434/v1";
const OLLAMA_MODEL = "llama3.1:latest";

/** Hard cap on how much of the pasted log we send (keeps prompts healthy). */
export const MAX_INPUT_CHARS = 40000;

/**
 * Resolve which open-weight model endpoint to use.
 * Order of precedence:
 *   1. Session overrides sent from the in-memory Model Settings modal.
 *   2. AI_PROVIDER=ollama environment config (fully local/offline).
 *   3. GROQ_API_KEY environment config (fast open-weight cloud inference).
 *   4. Generic AI_API_KEY + AI_BASE_URL environment config.
 *
 * Returns null when no usable configuration exists.
 */
export function resolveProviderConfig(sessionConfig = {}) {
  const apiKey = typeof sessionConfig.apiKey === "string" ? sessionConfig.apiKey.trim() : "";
  const baseUrl = typeof sessionConfig.baseUrl === "string" ? sessionConfig.baseUrl.trim() : "";
  const model = typeof sessionConfig.model === "string" ? sessionConfig.model.trim() : "";

  // 1. Session-level overrides (only kept in browser memory, never persisted).
  if (apiKey) {
    return {
      provider: "session",
      apiKey: apiKey,
      baseUrl: baseUrl || GROQ_BASE_URL,
      model: model || DEFAULT_MODEL,
      label: "Session model",
    };
  }

  // 2. Local Ollama — no API key needed, inference never leaves the machine.
  if (process.env.AI_PROVIDER === "ollama") {
    return {
      provider: "ollama",
      apiKey: null,
      baseUrl: process.env.AI_BASE_URL || OLLAMA_BASE_URL,
      model: process.env.AI_MODEL || OLLAMA_MODEL,
      label: "Local Ollama",
    };
  }

  // 3. Groq-hosted open-weight models.
  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.AI_BASE_URL || GROQ_BASE_URL,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      label: "Groq",
    };
  }

  // 4. Any other OpenAI-compatible open-weight host.
  if (process.env.AI_API_KEY && process.env.AI_BASE_URL) {
    return {
      provider: "custom",
      apiKey: process.env.AI_API_KEY,
      baseUrl: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      label: "Custom provider",
    };
  }

  return null;
}

/** Builds the system + user prompt pair for the digest request. */
export function buildDigestPrompt(rawMessages) {
  const trimmed =
    rawMessages.length > MAX_INPUT_CHARS
      ? `${rawMessages.slice(-MAX_INPUT_CHARS)}\n[…older messages trimmed…]`
      : rawMessages;

  const system = [
    "You are Sloth Digest, an assistant that turns a messy group-chat log into a calm 'morning briefing' so the user never has to read it all.",
    "Rules:",
    "- Use ONLY information present in the log. Never invent events, names, or numbers.",
    "- 'You' inside the log refers to the user reading this (the chat owner).",
    '- headline: one punchy line, at most 90 characters. It is the "here is what actually happened".',
    "- summary: exactly 2 sentences covering the essentials.",
    "- topics: 3 to 6 notable moments, each with a short emoji and one-line description.",
    "- actionItems: 0 to 5 concrete things someone must DO (not observations). Set owner to 'You' when the task falls on the chat owner; otherwise use the person's name.",
    "- replies: 0 to 4 messages that clearly deserve a response from the user. Draft replies must be short (max 140 characters), casual, and natural.",
    "- vibe: at most 40 characters describing the chat's overall mood, ending with one fitting emoji.",
    "- timeSavedMinutes: integer between 3 and 30 estimating minutes saved versus reading every message carefully.",
    'Return ONLY a valid JSON object: {"headline": string, "summary": string, "topics": [{"who": string, "what": string, "emoji": string}], "actionItems": [{"task": string, "owner": string, "priority": "high" | "medium" | "low", "deadline": string}], "replies": [{"from": string, "excerpt": string, "draft": string}], "vibe": string, "timeSavedMinutes": number}',
    "Schema rules: 'deadline' may be an empty string when unknown. Omit nothing; use empty arrays when nothing qualifies.",
  ].join("\n");

  const user = `Here is the raw chat log:\n\n<<<\n${trimmed}\n>>>\n\nProduce the morning briefing as the JSON object described above.`;

  return { system, user };
}

/**
 * Calls an OpenAI-compatible /chat/completions endpoint.
 * Throws Error with a human-friendly message; maps common provider failures.
 */
export async function callModel({ baseUrl, apiKey, model, system, user }) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const body = {
    model: model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    if (error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("The model took too long to respond. Try again or use a smaller chat log.");
    }
    throw new Error("Could not reach the model provider. Check your connection or base URL.");
  }

  if (!response.ok) {
    const message = await describeProviderError(response);
    throw new Error(message);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The model provider returned a response that was not valid JSON.");
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("The model returned an empty response. Try again.");
  }
  return content;
}

/** Turns a non-OK provider response into a helpful, safe error message. */
async function describeProviderError(response) {
  let detail = "";
  try {
    const data = await response.json();
    detail = data?.error?.message || data?.message || "";
  } catch {
    // Ignore unparsable error bodies.
  }

  if (response.status === 401 || response.status === 403) {
    return "The API key was rejected by the provider. Check the key in your environment or Model Settings.";
  }
  if (response.status === 404) {
    return `The model "${detail || "you selected"}" was not found on this provider. Check the model name in Model Settings.`;
  }
  if (response.status === 429) {
    return "Rate limit reached at the provider. Wait a moment and try again.";
  }
  if (response.status >= 500) {
    return "The model provider is having trouble right now. Try again shortly.";
  }
  return detail ? `Provider error: ${detail}` : `Provider error (HTTP ${response.status}).`;
}

/** Extracts a JSON object from model text, tolerating stray code fences. */
export function extractJson(text) {
  const value = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(value);
  } catch {
    // Fall through to the brace-slicing attempt.
  }
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(value.slice(start, end + 1));
    } catch {
      // Give up below.
    }
  }
  throw new Error("Could not understand the model's response as a digest.");
}

/* ---------------------------------------------------------------------------
 * Runtime validation & normalization.
 * JSON mode promises valid syntax, not schema compliance — so we sanitize
 * everything before it reaches the UI.
 * ------------------------------------------------------------------------- */

function asString(value, fallback) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function asBoundedItems(value, maxItems, mapper) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(mapper).filter(Boolean);
}

/**
 * Normalizes any model output into a Digest the UI can safely render.
 * Always returns a complete object with all fields present.
 */
export function validateDigest(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  const headline = asString(source.headline, "Your overnight briefing");
  const summary = asString(
    source.summary,
    "The model did not return a summary for this log. Try regenerating."
  );
  const vibe = asString(source.vibe, "Calm and handled 🦥");

  const topics = asBoundedItems(source.topics, 6, (item) => {
    if (!item || typeof item !== "object") return null;
    return {
      who: asString(item.who, "Someone"),
      what: asString(item.what, ""),
      emoji: asString(item.emoji, "💬"),
    };
  }).filter((topic) => topic.what !== "");

  const actionItems = asBoundedItems(source.actionItems, 5, (item) => {
    if (!item || typeof item !== "object") return null;
    const task = asString(item.task, "");
    if (task === "") return null;
    const priority = ["high", "medium", "low"].includes(item.priority)
      ? item.priority
      : "medium";
    return {
      task: task,
      owner: asString(item.owner, "Someone"),
      priority: priority,
      deadline: asString(item.deadline, ""),
    };
  });

  const replies = asBoundedItems(source.replies, 4, (item) => {
    if (!item || typeof item !== "object") return null;
    const from = asString(item.from, "Someone");
    const excerpt = asString(item.excerpt, "");
    if (excerpt === "") return null;
    return {
      from: from,
      excerpt: excerpt,
      draft: asString(item.draft, `Hey ${from}! Saw this — will get on it.`),
    };
  });

  const timeSavedMinutes = Math.min(
    120,
    Math.max(1, Math.round(Number(source.timeSavedMinutes) || 15))
  );

  return {
    headline: headline,
    summary: summary,
    topics: topics,
    actionItems: actionItems,
    replies: replies,
    vibe: vibe,
    timeSavedMinutes: timeSavedMinutes,
  };
}
