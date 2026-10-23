"use client";

/**
 * components/LoadingScene.jsx
 * The "sloth working while you sleep" loading state: a snoozing sloth with
 * drifting Zzz, a slow shimmer progress bar, and rotating status lines.
 */

import { useEffect, useState } from "react";

const STATUS_LINES = [
  "Counting your unread pings…",
  "Skipping the memes (there were many)…",
  "Spotting who needs you…",
  "Drafting replies in your voice…",
  "Brewing the morning briefing…",
];

export default function LoadingScene({ messageCount }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % STATUS_LINES.length);
    }, 2100);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="pop-in rounded-3xl border border-ui-border bg-surface/70 p-10 text-center"
    >
      <div className="relative mx-auto flex h-32 w-24 items-center justify-center">
        <span className="sloth-float text-6xl" role="img" aria-label="Snoozing sloth">
          🦥
        </span>
        <span aria-hidden="true" className="zzz text-sm zzz-1 top-0 right-0">
          z
        </span>
        <span aria-hidden="true" className="zzz text-base zzz-2 top-2 right-2">
          z
        </span>
        <span aria-hidden="true" className="zzz text-lg zzz-3 top-4 right-4">
          Z
        </span>
      </div>

      <p className="mt-2 text-lg font-medium text-foreground">
        The sloth is reading{" "}
        <span className="text-accent">
          {typeof messageCount === "number" && messageCount > 0
            ? `${messageCount} messages`
            : "your chat log"}
        </span>
      </p>
      <p className="mt-1 text-sm text-muted">{STATUS_LINES[index]}</p>

      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-1.5 w-52 overflow-hidden rounded-full bg-surface-raised"
      >
        <div className="shimmer h-full w-full rounded-full" />
      </div>

      <p className="mt-6 text-xs text-muted">
        Slow and steady reads every word — you&apos;d rather not.
      </p>
    </section>
  );
}
