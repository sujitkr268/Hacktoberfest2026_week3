*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

## What I Built

Group chats are where good messages go to be forgotten. You fall asleep, wake up to 200+ messages, and face the classic choice: a 20-minute scroll that derails your morning, or missing something important — the one message that asked for your help, the one deadline that landed on you, the one place you were supposed to reply.

**Sloth Digest** is an open-weight AI tool that does the reading for you. Paste your group chat log (WhatsApp, Slack, Discord, or plain text), and an open-weight model turns it into a calm **morning briefing**:

1. **Headline + 2-line TL;DR** — what actually happened, in the order that matters.
2. **"What went down"** — 3–6 notable moments, each with an emoji, so you can catch up in seconds.
3. **"Needs doing"** — a tickable checklist of real tasks: who owns each one, priority (high/medium/low), and deadline.
4. **"Worth a reply"** — messages that addressed *you*, each with a **pre-drafted reply** ready to copy in one tap.
5. **Vibe + time-saved stats** — every briefing ends with an estimated skim-time saved, and the archive accumulates your total "laziness payoff."

The mascot is not a gimmick: the sloth is the product thesis. Slow, methodical reading of every single message — done for you, exactly once, while you relax.

## Demo

**Live Web Application:** [ADD-VERCEL-URL-HERE]

You can press **"Try the sample"** for a complete offline demo (a curated chat log + pre-built briefing — works without a key and without network). Then paste your own chat log and press **"🦥 Digest it"** for the real thing.

*Screenshots: [ADD 1: hero + input card] [ADD 2: morning briefing card] [ADD 3: history + stats panel]*

## Code

{% github sujitkr268/Hacktoberfest2026_week3 %}

* **GitHub Repository:** [https://github.com/sujitkr268/Hacktoberfest2026_week3](https://github.com/sujitkr268/Hacktoberfest2026_week3)

MIT-licensed, built with Next.js 16 (App Router), React 19, Tailwind CSS v4 — in plain JavaScript, deliberately beginner-readable.

## How I Built It

**Architecture:** One Next.js application. The browser renders the UI; a single Route Handler (`app/api/generate-digest/route.js`) is the entire backend. No database, no accounts, no telemetry — history and stats live entirely in the user's `localStorage` (last 20 briefings).

**Open-weight inference core:** The app talks to any OpenAI-compatible chat completions endpoint:

* **Default:** `openai/gpt-oss-120b` via Groq Cloud (open-weight, fast, free tier).
* **Fully local/offline:** set `AI_PROVIDER=ollama` and it runs on `llama3.1` with Ollama — literally no internet needed once weights are downloaded.
* **Portable:** Together, OpenRouter, DeepInfra, vLLM, or any self-hosted server via `AI_API_KEY` + `AI_BASE_URL` — zero code changes.

**Why the output is trustworthy:** the request uses JSON mode (`response_format: json_object`), which guarantees valid JSON syntax but not a complete schema — so `validateDigest()` re-checks everything at runtime: string sanitization with safe fallbacks, array bounds, priority normalization, numeric clamping. Hostile model output can only ever produce a slightly conservative briefing, never a crash.

**API key safety:** the key is server-side only (environment variables or an in-memory session key in the settings modal — never persisted). The browser never sees it.

## Why Does Open Innovation Matter?

Group chats are the most private text most people produce. An AI tool that reads your group chats must let the user control where that text goes — and open weights are what make that control real:

1. **Local sovereignty:** with Ollama, the entire pipeline — your messages, the drafts, the digests — runs on your own hardware with zero network calls. A closed API physically cannot offer that.
2. **No lock-in, no spend:** switching models is two environment variables. If a host changes pricing or limits, the app keeps working, free, on your laptop.
3. **Auditable behavior:** the prompt that decides what "deserves a reply" is committed code, open for anyone to inspect, fork, or reshape — not a black box that quietly tunes for engagement.

## The Lazy Payoff

The app measures itself: every briefing stores how many messages it read and estimates minutes saved (a per-message skim-time model shows in the archive panel). During testing, briefings on ~200-message logs routinely replaced 10–15 minutes of scrolling with a 40-second read. As a bonus, the *offline sample mode* means even the demo costs nothing — no key, no network.

## Prize Categories

* **Primary Track:** Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady (Overall Challenge)

*(No partner-specific categories — the project runs fully on open-weight models and deploys on Vercel.)*
