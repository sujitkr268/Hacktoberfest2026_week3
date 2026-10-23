"use client";

/**
 * components/SettingsModal.jsx
 * In-memory model settings: a temporary API key (kept only in browser memory
 * for this tab, never persisted) plus optional base URL / model overrides
 * stored in localStorage. Environment variables still win for secrets.
 */

import { useState } from "react";
import { KeyRound, ShieldCheck, X } from "lucide-react";

/**
 * Rendered with a `key` that changes whenever it opens, so the editorial
 * state is always freshly initialized from the latest props on mount.
 */
export default function SettingsModal({ open, initialPrefs, sessionKey, onClose, onSave }) {
  const [key, setKey] = useState(sessionKey);
  const [baseUrl, setBaseUrl] = useState(initialPrefs.baseUrl);
  const [model, setModel] = useState(initialPrefs.model);

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      apiKey: key.trim(),
      prefs: { baseUrl: baseUrl.trim(), model: model.trim() },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="pop-in w-full max-w-md rounded-2xl border border-ui-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-accent" aria-hidden="true" />
            Model settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-2 text-muted transition hover:bg-surface-raised hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
              API key (optional)
            </label>
            <input
              id="apiKey"
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="sk-… or gsk_… — stays in this tab's memory only"
              className="mt-1.5 w-full rounded-xl border border-ui-border bg-surface-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70"
            />
            <p className="mt-1 text-xs text-muted">
              Never saved to disk — survives only while this tab is open.
            </p>
          </div>

          <div>
            <label htmlFor="baseUrl" className="text-sm font-medium text-foreground">
              Base URL (optional)
            </label>
            <input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.groq.com/openai/v1 or http://localhost:11434/v1"
              className="mt-1.5 w-full rounded-xl border border-ui-border bg-surface-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70"
            />
          </div>

          <div>
            <label htmlFor="model" className="text-sm font-medium text-foreground">
              Model (optional)
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="openai/gpt-oss-120b · llama3.1:latest · …"
              className="mt-1.5 w-full rounded-xl border border-ui-border bg-surface-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-mint-soft/60 p-3 text-xs text-mint">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              With <code className="font-mono">GROQ_API_KEY</code> in{" "}
              <code className="font-mono">.env.local</code> you can leave all of this blank. Point the
              base URL at a local Ollama server and your group chats never leave your machine.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-accent-strong px-4 py-2.5 text-sm font-semibold text-[#1a1206] transition hover:bg-accent"
            >
              Save settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
