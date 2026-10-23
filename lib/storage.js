/**
 * lib/storage.js
 * -----------------------------------------------------------------------------
 * Client-side persistence helpers. Sloth Digest has intentionally NO database
 * and NO accounts: digests and UI preferences live entirely in this browser.
 *
 * Storage keys:
 *   slothDigest.history.v1  -> [{ id, createdAt, messageCount, inputPreview, digest }]
 *   slothDigest.settings.v1 -> { baseUrl, model } (never the API key!)
 */

const HISTORY_KEY = "slothDigest.history.v1";
const SETTINGS_KEY = "slothDigest.settings.v1";
const MAX_HISTORY = 20;

// Sloth Digest writes are always triggered by the app itself, so a tiny
// window-event bus keeps subscribed components in sync with localStorage.
const HISTORY_EVENT = "sloth-digest:history-changed";
const SETTINGS_EVENT = "sloth-digest:settings-changed";

function notifyHistoryNext() {
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

function notifySettingsChanged() {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
}

export function subscribeHistory(callback) {
  window.addEventListener(HISTORY_EVENT, callback);
  return () => window.removeEventListener(HISTORY_EVENT, callback);
}

export function subscribeSettings(callback) {
  window.addEventListener(SETTINGS_EVENT, callback);
  return () => window.removeEventListener(SETTINGS_EVENT, callback);
}

export function notifyHistorySync() {
  notifyHistoryNext();
}

export function notifySettingsSync() {
  notifySettingsChanged();
}

export function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDigest(entry) {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    notifyHistoryNext();
  } catch {
    // Storage might be unavailable (private mode) — history simply won't persist.
  }
}

export function deleteDigest(id) {
  if (typeof window === "undefined") return;
  try {
    const next = loadHistory().filter((entry) => entry.id !== id);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    notifyHistoryNext();
  } catch {
    // Storage unavailable — nothing to update.
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    notifyHistoryNext();
  } catch {
    // Storage unavailable — nothing to update.
  }
}

/** Non-secret settings only: baseUrl + model. The API key stays in memory. */
export function loadSettings() {
  if (typeof window === "undefined") return { baseUrl: "", model: "" };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
      model: typeof parsed.model === "string" ? parsed.model : "",
    };
  } catch {
    return { baseUrl: "", model: "" };
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        baseUrl: typeof settings.baseUrl === "string" ? settings.baseUrl : "",
        model: typeof settings.model === "string" ? settings.model : "",
      })
    );
    notifySettingsChanged();
  } catch {
    // Storage unavailable — settings will simply not persist.
  }
}

/** Rough skim-time (minutes) the UI shows alongside the model's estimate. */
export function estimateReadingMinutes(messageCount) {
  return Math.max(1, Math.round(messageCount * 0.8));
}
