"use client";

/**
 * components/DigestView.jsx
 * Renders the morning briefing: headline card, TL;DR, notable moments,
 * action-item checklist, and pre-drafted replies with one-tap copy.
 */

import { useState } from "react";
import {
  Check,
  CircleCheck,
  ClipboardCopy,
  Clock,
  Coffee,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

const PRIORITY_STYLES = {
  high: "bg-peach/15 text-peach border-peach/30",
  medium: "bg-accent-soft text-accent border-accent/30",
  low: "bg-mint-soft text-mint border-mint/30",
};

function SectionHeading({ icon: Icon, title, hint }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4.5 w-4.5 text-accent" aria-hidden="true" />
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

function ReplyCard({ reply }) {
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(reply.draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the text is still visible to copy manually.
    }
  }

  return (
    <div className="rounded-2xl border border-ui-border bg-surface p-4 transition hover:border-accent/40">
      <p className="text-sm text-muted">
        <span className="font-medium text-foreground">{reply.from}:</span> “{reply.excerpt}”
      </p>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <p className="flex-1 rounded-xl bg-surface-raised px-3 py-2 text-sm text-foreground">
          <span
            aria-hidden="true"
            className="mr-1.5 text-pink-400 text-xs"
          >
            ↩
          </span>
          {reply.draft}
        </p>
        <button
          type="button"
          onClick={copyDraft}
          aria-live="polite"
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition ${
            copied
              ? "border-mint/40 bg-mint-soft text-mint"
              : "border-ui-border text-muted hover:border-accent/40 hover:text-accent"
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copied
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DigestView({ digest, messageCount, isSample, onRedigest }) {
  const [done, setDone] = useState(() => new Set());

  function toggleDone(index) {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const visibleActions = digest.actionItems.filter((_, index) => !done.has(index));
  const allActionsDone =
    digest.actionItems.length > 0 && digest.actionItems.length === done.size;

  return (
    <section aria-live="polite" className="mt-10 space-y-8">
      {/* Headline card */}
      <article className="digest-glow fade-up rounded-3xl border border-accent/25 bg-gradient-to-b from-surface to-surface-raised p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Morning briefing
          </span>
          <span className="rounded-full border border-ui-border px-3 py-1 text-xs text-muted">
            {digest.vibe}
          </span>
          {isSample ? (
            <span className="rounded-full border border-mint/30 bg-mint-soft px-3 py-1 text-xs text-mint">
              Sample — offline, no API used
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          {digest.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{digest.summary}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1.5 rounded-xl bg-surface-raised px-3 py-1.5 text-muted">
            <MessageCircle className="h-4 w-4 text-accent" aria-hidden="true" />
            {typeof messageCount === "number" && messageCount > 0 ? messageCount : "your"} messages
            read
          </span>
          <span className="flex items-center gap-1.5 rounded-xl bg-surface-raised px-3 py-1.5 text-muted">
            <Clock className="h-4 w-4 text-mint" aria-hidden="true" />
            ~{digest.timeSavedMinutes} min saved
          </span>
        </div>
      </article>

      {/* Notable moments */}
      {digest.topics.length > 0 ? (
        <div className="fade-up" style={{ animationDelay: "70ms" }}>
          <SectionHeading icon={Coffee} title="What went down" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {digest.topics.map((topic, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-2xl border border-ui-border bg-surface p-4"
              >
                <span className="text-xl" aria-hidden="true">
                  {topic.emoji}
                </span>
                <p className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">{topic.who}</span>{" "}
                  <span className="text-muted">{topic.what}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Action items */}
      <div className="fade-up" style={{ animationDelay: "140ms" }}>
        <SectionHeading
          icon={Zap}
          title="Needs doing"
          hint={digest.actionItems.length > 0 ? `${visibleActions.length} open` : ""}
        />
        {digest.actionItems.length === 0 ? (
          <p className="rounded-2xl border border-mint/25 bg-mint-soft/50 p-4 text-sm text-mint">
            Zero tasks for you. Just vibes. 🦥
          </p>
        ) : (
          <>
            <ul className="space-y-2.5">
              {digest.actionItems.map((action, index) => (
                <li
                  key={index}
                  className={`pop-in flex items-start gap-3 rounded-2xl border border-ui-border bg-surface p-4 transition ${
                    done.has(index) ? "opacity-45" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(index)}
                    aria-pressed={done.has(index)}
                    aria-label={`Mark "${action.task}" as done`}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      done.has(index)
                        ? "border-mint bg-mint-soft text-mint"
                        : "border-ui-border hover:border-accent"
                    }`}
                  >
                    {done.has(index) ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </button>
                  <p className="flex-1 text-sm leading-relaxed text-foreground">{action.task}</p>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                        PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.medium
                      }`}
                    >
                      {action.priority}
                    </span>
                    <span className="rounded-full border border-ui-border px-2.5 py-0.5 text-[11px] text-muted">
                      {action.owner}
                    </span>
                    {action.deadline ? (
                      <span className="rounded-full border border-ui-border px-2.5 py-0.5 text-[11px] text-muted">
                        {action.deadline}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {allActionsDone ? (
              <p className="pop-in mt-3 flex items-center gap-2 text-sm font-medium text-mint">
                <CircleCheck className="h-4 w-4" aria-hidden="true" />
                Everything handled. Sloth levels: maximum.
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Drafted replies */}
      {digest.replies.length > 0 ? (
        <div className="fade-up" style={{ animationDelay: "210ms" }}>
          <SectionHeading
            icon={MessageCircle}
            title="Worth a reply"
            hint="drafts ready to copy"
          />
          <div className="space-y-3">
            {digest.replies.map((reply, index) => (
              <ReplyCard key={index} reply={reply} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Footer actions */}
      <div className="fade-up flex flex-wrap items-center gap-3" style={{ animationDelay: "280ms" }}>
        <button
          type="button"
          onClick={onRedigest}
          className="rounded-xl border border-ui-border px-4 py-2.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent"
        >
          ↻ Digest a new log
        </button>
        <span className="text-xs text-muted">
          Briefing saved to your browser only — no accounts, no servers.
        </span>
      </div>
    </section>
  );
}
