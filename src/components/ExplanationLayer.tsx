/**
 * P5-T3 — ExplanationLayer: the "door" a clickable Overview card opens.
 *
 * A right-sliding drawer (glass-card style, matching the Overview cards and
 * TimeDependencyNote tone) that shows a Content-Registry entry's explanation
 * plus a PROFILE ANCHOR — the real datum (sign + degree, stem + element, …)
 * spliced into the entry's literal " {anchor}" slot. It also serves the HONEST
 * ABSENCE case: when a datum is unavailable (e.g. the ascendant without a birth
 * time), the layer renders a calm explanation of WHY instead of an invented
 * sign or an empty panel.
 *
 * Anti-reification (Amendment D): the anchor is the only place a "dein"-pointer
 * appears; it is a data pointer, never a fixed-identity verdict. No advice-,
 * medical-, or fate-register wording anywhere (see the B-001 forbidden list).
 */
import React from "react";
import { createPortal } from "react-dom";
import type { ExplanationEntry } from "../content/registry";
import { trackEvent, type CardKind } from "../utils/analytics";

/** Honest-absence panel: shown when a datum could not be computed. */
export interface ExplanationAbsence {
  /** Heading, e.g. "Aszendent". */
  title: string;
  /** Glyph/symbol, e.g. "↑". */
  symbol: string;
  /** Calm explanation of why the datum is missing (references the cause). */
  body: string;
}

interface ExplanationLayerProps {
  /** The registry entry to explain, or null (then `absence` is rendered). */
  entry: ExplanationEntry | null;
  /** The real profile datum spliced into the entry's " {anchor}" slot. */
  anchorText: string | null;
  /** Honest-absence content when there is no entry (datum unavailable). */
  absence?: ExplanationAbsence | null;
  /** Which card opened this layer (recorded for layer_open analytics). */
  card?: CardKind;
  onClose: () => void;
}

/** Literal slot the registry `long` ends with; see registry/types.ts. */
const ANCHOR_SLOT = " {anchor}";

/**
 * Splice the real datum into the entry's " {anchor}" slot. When there is no
 * anchor datum, the slot fragment is removed cleanly so no dangling "{anchor}"
 * or trailing space leaks into the UI.
 */
function renderLong(long: string, anchorText: string | null): string {
  if (anchorText && anchorText.trim().length > 0) {
    return long.replace(ANCHOR_SLOT, ` — in deinem Profil: ${anchorText}`);
  }
  return long.replace(ANCHOR_SLOT, "");
}

export function ExplanationLayer({ entry, anchorText, absence, card, onClose }: ExplanationLayerProps): React.ReactElement | null {
  const isOpen = entry !== null || (absence != null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Fire layer_open exactly once per open (registry id, or null for absence).
  React.useEffect(() => {
    if (!isOpen) return;
    trackEvent("layer_open", { entryId: entry ? entry.id : null, card });
    // entry?.id keys the effect so re-opening a different door re-fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry?.id, absence?.title]);

  // Esc-to-close + focus management (move focus into the panel on open).
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = entry ? entry.title : absence!.title;
  const symbol = entry ? entry.symbol : absence!.symbol;
  const ariaLabel = `Einordnung: ${title}`;

  const overlay = (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="explanation-layer-root">
      {/* Backdrop — click closes. */}
      <div
        data-testid="explanation-layer-backdrop"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Right-sliding drawer panel. */}
      <div
        ref={panelRef}
        data-testid="explanation-layer"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className="glass-card relative z-10 h-full w-full max-w-md overflow-y-auto p-6 sm:p-8 border-l border-gold-muted/20 shadow-2xl outline-none rounded-none animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Einordnung schließen"
          className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full text-stone-400 hover:text-gold-light hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted/60 cursor-pointer"
        >
          <span aria-hidden="true" className="text-lg leading-none">✕</span>
        </button>

        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <span className="font-serif text-5xl leading-none text-gold-light" aria-hidden="true">
            {symbol}
          </span>
          <h2 className="font-serif text-2xl font-bold text-gold-light tracking-tight">{title}</h2>
        </div>

        {entry ? (
          <p className="font-sans text-sm text-stone-300 leading-relaxed whitespace-pre-line">
            {renderLong(entry.long, anchorText)}
          </p>
        ) : (
          <p className="font-sans text-sm text-stone-300 leading-relaxed whitespace-pre-line">
            {absence!.body}
          </p>
        )}

        {entry && entry.source === "curated" && (
          <p className="mt-6 pt-4 border-t border-gold-muted/10 font-mono text-[10px] uppercase tracking-widest text-stone-500">
            Kuratierte Einordnung
          </p>
        )}
      </div>
    </div>
  );

  // Portal to body so the drawer escapes any clipping/transform ancestor.
  return typeof document !== "undefined" ? createPortal(overlay, document.body) : overlay;
}

export default ExplanationLayer;
