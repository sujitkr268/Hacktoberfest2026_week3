"use client";

/**
 * app/page.jsx — Sloth Digest main screen.
 *
 * Paste a group-chat log → an open-weight model (Groq / Ollama / any
 * OpenAI-compatible endpoint) reads every message server-side and returns a
 * calm morning briefing. No database, no accounts: history lives in
 * localStorage. The API key entered via Model Settings is kept only in memory.
 */

import { useEffect, useRef, useState } from "react";
import { Settings2, Sparkles, TriangleAlert } from "lucide-react";

import DigestView from "@/components/DigestView";
import HistoryPanel from "@/components/HistoryPanel";
import LoadingScene from "@/components/LoadingScene";
import SettingsModal from "@/components/SettingsModal";
import StarField from "@/components/StarField";
import { SAMPLE_LOG, generateSampleDigest } from "@/lib/sample";
import {
  clearHistory as clearStoredHistory,
  deleteDigest as deleteStoredDigest,
  estimateReadingMinutes,
  loadHistory,
  loadSettings,
  notifyHistorySync,
  notifySettingsSync,
  saveDigest,
  saveSettings,
  subscribeHistory,
  subscribeSettings,
} from "@/lib/storage";

const MIN_INPUT_CHARS = 40;

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `digest-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function countMessages(text) {
  return text.split("\n").filter((line) => line.trim() !== "").length;
}

export default function Home() {
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | digest | error
  const [digest, setDigest] = useState(null);
  const [digestMeta, setDigestMeta] = useState({ messageCount: 0, isSample: false });
  const [error, setError] = useState("");
  const [inputHint, setInputHint] = useState("");
  const [history, setHistory] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState("");
  const [prefs, setPrefs] = useState({ baseUrl: "", model: "" });

  const resultRef = useRef(null);
  const inputRef = useRef(null);

  // Subscribe to storage changes and sync once on mount: the notify calls
  // trigger our own listeners, which hydrate history + preferences from
  // localStorage without a synchronous setState inside the effect body.
  useEffect(() => {
    const unsubscribeHistory = subscribeHistory(() => setHistory(loadHistory()));
    const unsubscribeSettings = subscribeSettings(() => setPrefs(loadSettings()));
    notifyHistorySync();
    notifySettingsSync();
    return () => {
      unsubscribeHistory();
      unsubscribeSettings();
    };
  }, []);

  // Reveal the briefing smoothly whenever a new one appears.
  useEffect(() => {
    if (status === "digest") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status, digest]);

  function commitDigest(nextDigest, messageCount, isSample, inputUsed) {
    const entry = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      messageCount: messageCount,
      inputPreview: inputUsed.slice(0, 140),
      digest: nextDigest,
      isSample: isSample,
    };
    setDigestMeta({ messageCount: messageCount, isSample: isSample });
    setDigest(nextDigest);
    setStatus("digest");
    setError("");
    setInputHint("");
    saveDigest(entry);
  }

  async function digestNow() {
    const trimmed = log.trim();
    if (trimmed.length < MIN_INPUT_CHARS) {
      setInputHint(
        "Paste a few more messages first — even 5-10 chat lines are enough (40+ characters)."
      );
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/generate-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: trimmed,
          apiKey: sessionKey || undefined,
          baseUrl: prefs.baseUrl || undefined,
          model: prefs.model || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.digest) {
        setError(data?.error || "Something went wrong while reaching the model. Try again.");
        setStatus("error");
        return;
      }

      commitDigest(data.digest, countMessages(trimmed), false, trimmed);
    } catch {
      setError("Network error — could not reach the Sloth Digest server.");
      setStatus("error");
    }
  }

  function loadSample() {
    setLog(SAMPLE_LOG);
    commitDigest(generateSampleDigest(), countMessages(SAMPLE_LOG), true, SAMPLE_LOG);
  }

  function openHistoryEntry(entry) {
    setDigestMeta({ messageCount: entry.messageCount, isSample: entry.isSample });
    setDigest(entry.digest);
    setStatus("digest");
    setError("");
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteEntry(id) {
    deleteStoredDigest(id);
  }

  function clearAll() {
    clearStoredHistory();
  }

  function handleSettingsSave({ apiKey, prefs: nextPrefs }) {
    setSessionKey(apiKey);
    setPrefs(nextPrefs);
    saveSettings(nextPrefs);
    setSettingsOpen(false);
  }

  function focusInput() {
    setStatus("idle");
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const messageCount = countMessages(log);
  const stats = history.reduce(
    (totals, entry) => ({
      digests: totals.digests + 1,
      messagesRead: totals.messagesRead + (entry.messageCount || 0),
      minutesSaved: totals.minutesSaved + estimateReadingMinutes(entry.messageCount || 0),
    }),
    { digests: 0, messagesRead: 0, minutesSaved: 0 }
  );

  return (
    <>
      <StarField />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <span className="breathe text-2xl" role="img" aria-label="Sloth">
              🦥
            </span>
            <span className="text-lg font-bold tracking-tight">Sloth Digest</span>
            <span className="hidden items-center rounded-full border border-ui-border px-2.5 py-0.5 text-[11px] text-muted sm:flex">
              week 3 · slow &amp; steady
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open model settings"
            className="flex items-center gap-2 rounded-xl border border-ui-border px-3 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-accent"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Model settings
          </button>
        </header>

        {/* Hero */}
        <section className="py-8 text-center sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
            Hacktoberfest Open-Source AI Challenge
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Group chats move fast.
            <br />
            <span className="bg-gradient-to-r from-accent via-accent to-mint bg-clip-text text-transparent">
              You don&apos;t have to.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg">
            Paste last night&apos;s chat log. An open-weight model reads every message while you
            slow down — then hands you the headline, the tasks, and replies already drafted. The
            sloth does the work so you don&apos;t have to.
          </p>
        </section>

        {/* Input */}
        <section aria-labelledby="input-heading">
          <div className="rounded-3xl border border-ui-border bg-surface/70 p-5 shadow-xl backdrop-blur sm:p-6">
            <label
              htmlFor="chat-log"
              className="flex items-center justify-between text-sm font-medium text-foreground"
            >
              <span id="input-heading">Last night&apos;s chat log</span>
              {messageCount > 0 ? (
                <span className="rounded-full border border-ui-border px-2.5 py-0.5 text-[11px] text-muted">
                  ≈ {messageCount} messages
                </span>
              ) : null}
            </label>

            <textarea
              id="chat-log"
              ref={inputRef}
              value={log}
              onChange={(event) => {
                setLog(event.target.value);
                if (inputHint) setInputHint("");
              }}
              rows={8}
              spellCheck={false}
              placeholder="[23:41] Sam: are we still on for tomorrow?\n[23:43] Kim: yes but I need to leave by 4pm\n[23:44] Sam: ok who's driving? …"
              className="mt-3 w-full resize-y rounded-2xl border border-ui-border bg-surface-raised p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted/60"
            />

            {inputHint ? (
              <p className="mt-2 text-xs text-peach" aria-live="polite">
                {inputHint}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={digestNow}
                disabled={status === "loading"}
                className="rounded-xl bg-accent-strong px-5 py-3 text-sm font-bold text-[#1a1206] shadow-lg shadow-accent/20 transition hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                🦥 {status === "loading" ? "Digesting…" : "Digest it"}
              </button>
              <button
                type="button"
                onClick={loadSample}
                disabled={status === "loading"}
                className="flex items-center gap-1.5 rounded-xl border border-ui-border px-4 py-3 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Try the sample
              </button>
              <span className="ml-auto text-xs text-muted">Open weights · keys stay server-side</span>
            </div>
          </div>
        </section>

        {/* Status area */}
        <div ref={resultRef} className="scroll-mt-6">
          {status === "loading" ? (
            <div className="mt-10">
              <LoadingScene messageCount={messageCount} />
            </div>
          ) : null}

          {status === "error" ? (
            <div
              role="alert"
              className="pop-in mt-10 rounded-3xl border border-danger/35 bg-danger/5 p-6"
            >
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground">The sloth hit a snag</h2>
                  <p className="mt-1 text-sm text-muted">{error}</p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={digestNow}
                      className="rounded-xl border border-ui-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="rounded-xl border border-ui-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                    >
                      Open model settings
                    </button>
                    <button
                      type="button"
                      onClick={loadSample}
                      className="rounded-xl border border-ui-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                    >
                      Try the offline sample
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {status === "digest" && digest ? (
            <DigestView
              digest={digest}
              messageCount={digestMeta.messageCount}
              isSample={digestMeta.isSample}
              onRedigest={focusInput}
            />
          ) : null}
        </div>

        {/* History */}
        <HistoryPanel
          history={history}
          stats={stats}
          onOpen={openHistoryEntry}
          onDelete={deleteEntry}
          onClear={clearAll}
        />
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-14 w-full max-w-3xl px-4 pb-10 text-center text-xs text-muted sm:px-8">
        <p>
          Built for the{" "}
          <span className="text-foreground/80">
            Hacktoberfest Open-Source AI Challenge — Week 3: Slow and Steady
          </span>{" "}
          🦥
        </p>
        <p className="mt-1.5">
          Open-weight models in, lazy out. Runs locally with Ollama — your group chats never leave
          your machine.
        </p>
      </footer>

      <SettingsModal
        key={settingsOpen ? "settings-open" : "settings-closed"}
        open={settingsOpen}
        initialPrefs={prefs}
        sessionKey={sessionKey}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />
    </>
  );
}
