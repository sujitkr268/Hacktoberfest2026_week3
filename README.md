# Sloth Digest 🦥

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19).*

> **Group chats move fast. You don't have to.**
> Paste your chat log — an open-weight model reads every message and hands you a calm morning briefing: the headline, the tasks, and replies already drafted. The sloth does the work so you don't have to.

## What it does

Sloth Digest automates the most dreadfully repetitive part of modern messaging: **catching up**. Instead of scrolling through hundreds of overnight group messages, you get:

- **Headline + 2-line TL;DR** — what actually happened while you were away
- **What went down** — the notable moments, with who/what and an emoji
- **Needs doing** — a checklist of action items (who owns it, priority, deadline), tickable in the app
- **Worth a reply** — messages that deserve a response, each with a **pre-drafted reply** you can copy in one tap
- **The lazy payoff** — messages-read and minutes-saved stats, plus per-briefing time-saved estimates

## Features

- 🦥 **One input, zero configuration UX** — paste a WhatsApp / Slack / Discord / plain-text log
- ☁️ **Open-weight cloud inference** — default endpoint is Groq (`openai/gpt-oss-120b`), works with any OpenAI-compatible host (Together, OpenRouter, DeepInfra, vLLM…)
- 🔌 **Fully local, fully offline inference** — set `AI_PROVIDER=ollama` and use your own `llama3.1` (or any local model); your group chats never leave your machine
- ✨ **Offline sample mode** — *"Try the sample"* button returns a curated demo briefing with **zero** API calls (great for plane rides and no-key judges)
- 🗂 **History + lazy stats** — last 20 briefings stored in `localStorage`, with aggregate messages-read and time-saved. No database, no accounts, no telemetry
- 🎨 **Cozy animated UI** — twinkling night sky, snoozing sloth with drifting *zzz*, shimmer progress bar, gradient headline, smooth entrance animations (all `prefers-reduced-motion` aware)
- ♿ **Accessibility basics** — labeled inputs, `aria-live` status regions, visible focus rings, semantic buttons, keyboard-friendly modal
- 🛡 **Server-side keys** — the API key lives in server environment variables; a temporary session key can be entered in Model Settings but is kept in memory only

## Tech stack

- **Next.js 16 (App Router)** — one app, one Route Handler
- **JavaScript (no TypeScript)** — beginner-friendly, modular
- **React 19 + Tailwind CSS v4** — responsive, animated UI
- **Open-weight AI via an OpenAI-compatible inference API** (Groq / Ollama / custom)
- **localStorage** for history & preferences
- **Deploy:** Vercel

## Run it locally

Prerequisites: **Node.js 20+** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure your model provider (see Environment variables below)
cp .env.example .env.local
#    then edit .env.local and add your GROQ_API_KEY

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000>, paste a chat log, and press **🦥 Digest it**.

No API key? Press **✨ Try the sample** — it loads a demo log and shows a real briefing completely offline.

### Environment variables

| Variable       | Required | What it does                                                             |
| -------------- | -------- | ------------------------------------------------------------------------ |
| `GROQ_API_KEY` | Option A | Free key from <https://console.groq.com/keys> (fastest to set up)        |
| `AI_PROVIDER`  | Option B | Set to `ollama` for fully local inference                                |
| `AI_BASE_URL`  | Optional | Any OpenAI-compatible base URL (default: Groq; Ollama: `http://localhost:11434/v1`) |
| `AI_API_KEY`   | Option C | Key for a generic compatible provider (Together/OpenRouter/vLLM/…)       |
| `AI_MODEL`     | Optional | Model name (default: `openai/gpt-oss-120b`; Ollama: `llama3.1:latest`)   |

**Option A — Groq (recommended):**

```
GROQ_API_KEY=gsk_your_key_here
```

**Option B — Local Ollama (100% offline, chats never leave your laptop):**

1. Install [Ollama](https://ollama.com) and run `ollama run llama3.1`
2. Then:

```
AI_PROVIDER=ollama
```

**Option C — Any other open-weight host:**

```
AI_API_KEY=your_key
AI_BASE_URL=https://api.together.xyz/v1
AI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
```

## Project structure

```
week_3/
├── app/
│   ├── api/generate-digest/route.js   # POST endpoint: model call + validation (server-side)
│   ├── globals.css                    # Tailwind v4 + night-sky theme + animations
│   ├── layout.jsx                     # Fonts + metadata
│   └── page.jsx                       # Main screen (client): input → loading → briefing
├── components/
│   ├── DigestView.jsx                 # Briefing cards, checklist, copy-ready replies
│   ├── HistoryPanel.jsx               # localStorage archive + lazy-payoff stats
│   ├── LoadingScene.jsx               # Snoozing sloth + rotating status lines
│   ├── SettingsModal.jsx              # In-memory session key + endpoint overrides
│   └── StarField.jsx                  # Deterministic SSR-safe starfield + aurora
├── lib/
│   ├── ai.js                          # Provider resolution, prompt, OpenAI-compatible call, schema validation
│   ├── sample.js                      # Curated offline demo log + matching briefing
│   └── storage.js                     # localStorage helpers (history, settings)
├── .env.example                       # Provider configuration template
├── next.config.mjs / jsconfig.json / eslint.config.mjs
└── package.json
```

## How the AI part works

1. The client POSTs the raw chat log to `/api/generate-digest`.
2. The Route Handler resolves a provider (session key → Ollama → Groq → custom `AI_API_KEY`) — **the secret never reaches the browser**.
3. `buildDigestPrompt()` wraps the log in a strict system prompt that demands a specific JSON schema and forbids inventing facts.
4. The request sets `response_format: { type: "json_object" }`, then `validateDigest()` **sanitizes everything at runtime anyway** — JSON mode guarantees valid syntax, not schema compliance. Missing fields get safe fallbacks, arrays get bounded, priorities get normalized.
5. Failures (401 invalid key, 429 rate limit, timeouts…) are mapped to friendly error messages the UI can act on (retry / settings / offline sample).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In [Vercel](https://vercel.com/import), import the repo (framework auto-detected: Next.js).
3. Add `GROQ_API_KEY` (or `AI_API_KEY` + `AI_BASE_URL`) in **Project → Settings → Environment Variables**.
4. Deploy. Done — sloth deployed.

> Note: local Ollama inference only works on your own machine (a deployed app can't reach `localhost:11434`); on Vercel it uses the cloud open-weight endpoint.

## Why open (short version)

- **Private by design:** your group chats are sensitive. With local Ollama inference, the entire pipeline — messages, drafts, digests — runs on your hardware with zero network calls.
- **No lock-in, no spend:** switch providers by changing two env vars; run it for free forever with local weights.
- **Auditable behavior:** the prompt that decides what "deserves a reply" is open code — inspect it, fork it, tune it.

## Security notes

- Built and tested on **Next.js 16.4.2**, which patches the October 2026 advisories (unauthenticated RCE in the Image Optimization API, DoS via Server Actions, RCE in `use cache` typed-array returns). Keep Next patched when you update dependencies.
- `npm audit` reports 5 "high" findings that all trace to one **dev-only** dependency chain (`braces` → `micromatch` → `fast-glob` → `eslint-config-next`, a lint glob parser). None of it ships to the browser or runtime; the only suggested fix downgrades `eslint-config-next` to v14, which would break this project. Re-check when upstream ships a fix.

## License

MIT — sloth-speed, open-source, no strings attached.
