/**
 * P5-T3 — Amendment B: lightweight, in-app analytics event sink.
 *
 * The Content-Registry "doors" (Overview cards → ExplanationLayer) emit two
 * in-process events so we can measure whether the doors are actually opened:
 *   - card_click → fires when a card is activated (entry id + card kind)
 *   - layer_open → fires when the explanation drawer mounts
 *
 * HARD product constraints (enforced by analytics.test.ts):
 *   1. Purely in-process + unit-testable: a `trackEvent()` writer, a
 *      `getEvents()` reader and a `resetEvents()` test hook. No third-party SDK,
 *      no React-context singleton.
 *   2. NO network beacon: trackEvent never touches fetch / sendBeacon / XHR /
 *      Image() — it only appends to a module-local array.
 *   3. NO PII EVER: only an explicit non-PII allowlist of prop keys is recorded.
 *      The user's name, birth date and birth place can never be stored — neither
 *      as keys nor as values — because keys outside the allowlist are dropped at
 *      the boundary. This is the Amendment B privacy line: entertainment
 *      analytics, not surveillance.
 */

/** The two in-app event names. Extend deliberately, not ad hoc. */
export type AnalyticsEventName = "card_click" | "layer_open";

/**
 * Card kinds that can open an ExplanationLayer "door". Used as the `card` prop
 * so we can tell which surface was activated without ever recording identity.
 */
export type CardKind = "sun" | "moon" | "ascendant" | "pillar" | "dayMaster" | "element";

/**
 * The ONLY prop keys an analytics event may carry. Every key here is a content
 * token, never PII:
 *   - entryId: a registry id (e.g. "zodiac.libra", "stem.jia") or null for an
 *     honest-absence layer (unknown ascendant) that maps to no entry.
 *   - card:    which card kind was activated.
 *   - token:   an optional secondary content token (e.g. a referenced branch id
 *     like "branch.zi"), never a personal value.
 */
export interface AnalyticsProps {
  entryId?: string | null;
  card?: CardKind;
  token?: string;
}

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props: AnalyticsProps;
}

/** Non-PII allowlist — anything not listed is dropped at the boundary. */
const ALLOWED_PROP_KEYS = ["entryId", "card", "token"] as const;
type AllowedKey = (typeof ALLOWED_PROP_KEYS)[number];

/** Module-local, in-process sink. Never serialized off-process. */
const events: AnalyticsEvent[] = [];

/**
 * Keep only the allowlisted, non-PII keys and only primitive (string | null)
 * values. A careless caller can pass `name`/`birthDate`/`birthPlace`; they are
 * silently dropped because they are not in the allowlist. Object/array values
 * are rejected too, so no PII can hide in a nested structure.
 */
function sanitizeProps(raw: Record<string, unknown>): AnalyticsProps {
  const clean: AnalyticsProps = {};
  for (const key of ALLOWED_PROP_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const value = raw[key as keyof typeof raw];
    if (value === null || typeof value === "string") {
      (clean as Record<AllowedKey, string | null | undefined>)[key] = value as string | null;
    }
  }
  return clean;
}

/**
 * Record an in-app analytics event. Fire-and-forget, synchronous, zero network.
 * @param name  one of the deliberate event names
 * @param props non-PII props; only allowlisted keys are persisted
 */
export function trackEvent(name: AnalyticsEventName, props: AnalyticsProps = {}): void {
  events.push({ name, props: sanitizeProps(props as Record<string, unknown>) });
}

/**
 * Read the recorded events. Returns a defensive copy (events + their props), so
 * a caller mutating the result cannot corrupt the sink.
 */
export function getEvents(): AnalyticsEvent[] {
  return events.map((e) => ({ name: e.name, props: { ...e.props } }));
}

/** Clear the sink. Test-isolation hook (and a way to reset between sessions). */
export function resetEvents(): void {
  events.length = 0;
}
