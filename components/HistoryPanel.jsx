"use client";

/**
 * components/HistoryPanel.jsx
 * Past briefings, stored in localStorage. Click an entry to reopen it, delete
 * individually, or wipe everything. Also shows aggregate "lazy payoff" stats.
 */

import { Archive, Trash, X } from "lucide-react";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSavedMinutes(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function HistoryPanel({ history, stats, onOpen, onDelete, onClear }) {
  return (
    <section className="mt-14" aria-labelledby="history-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="history-heading"
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <Archive className="h-5 w-5 text-accent" aria-hidden="true" />
          Past briefings
        </h2>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted transition hover:text-danger"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {stats && stats.messagesRead > 0 ? (
        <div className="mb-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-ui-border bg-surface p-3">
            <p className="text-xl font-bold text-accent">{stats.digests}</p>
            <p className="text-xs text-muted">briefings</p>
          </div>
          <div className="rounded-2xl border border-ui-border bg-surface p-3">
            <p className="text-xl font-bold text-accent">{stats.messagesRead}</p>
            <p className="text-xs text-muted">messages read for you</p>
          </div>
          <div className="rounded-2xl border border-ui-border bg-surface p-3">
            <p className="text-xl font-bold text-mint">{formatSavedMinutes(stats.minutesSaved)}</p>
            <p className="text-xs text-muted">of skimming avoided</p>
          </div>
        </div>
      ) : null}

      {history.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ui-border p-6 text-center text-sm text-muted">
          No briefings yet. Paste a chat log above and wake up to your first one. 🌅
        </p>
      ) : (
        <ul className="space-y-2.5">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center gap-3 rounded-2xl border border-ui-border bg-surface p-3.5 transition hover:border-accent/40"
            >
              <span className="text-lg" aria-hidden="true">
                {entry.isSample ? "✨" : "🦥"}
              </span>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-foreground transition group-hover:text-accent">
                  {entry.digest?.headline || "Untitled briefing"}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatWhen(entry.createdAt)} · {entry.messageCount} messages
                  {entry.isSample ? " · sample" : ""}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete briefing from ${formatWhen(entry.createdAt)}`}
                className="rounded-lg p-2 text-muted opacity-0 transition hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-40"
              >
                <Trash className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
