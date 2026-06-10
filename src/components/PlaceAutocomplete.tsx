import React from "react";
import { MapPin, Check, Loader2 } from "lucide-react";
import { BazodiacClient, PlacePrediction, ResolvedPlace } from "../api/bazodiacClient";

interface PlaceAutocompleteProps {
  id: string;
  label: string;
  /** Currently selected/typed label text. */
  value: string;
  /** Whether a place is fully resolved (lat/lon/tz present). */
  resolved: boolean;
  onResolved: (place: ResolvedPlace) => void;
  onClear: () => void;
}

/**
 * Server-backed place picker. Browser only ever talks to /api/places/* and
 * /api/geocode — never to Google directly. A chart submit stays blocked until
 * `resolved` is true (lat/lon/tz present).
 */
export default function PlaceAutocomplete({ id, label, value, resolved, onResolved, onClear }: PlaceAutocompleteProps) {
  const [query, setQuery] = React.useState(value);
  const [predictions, setPredictions] = React.useState<PlacePrediction[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const runSearch = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.trim().length < 2) {
        setPredictions([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const preds = await BazodiacClient.searchPlaces(text);
        setPredictions(preds);
        setOpen(true);
      } catch {
        setError("Ortssuche fehlgeschlagen.");
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onClear(); // typing invalidates any previously resolved place
    runSearch(text);
  };

  const handleSelect = async (pred: PlacePrediction) => {
    setOpen(false);
    setQuery(pred.description);
    setLoading(true);
    setError(null);
    try {
      const place = await BazodiacClient.resolvePlace(pred.placeId, pred.description);
      onResolved(place);
    } catch {
      setError("Ortsauflösung fehlgeschlagen.");
      onClear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5 relative">
      <label htmlFor={id} className="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-wide block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-muted/70">
          <MapPin className="h-4 w-4" />
        </span>
        <input
          id={id}
          type="text"
          autoComplete="off"
          placeholder="z.B. Berlin, Deutschland"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          className="w-full bg-obsidian-deep/60 text-[#E0D8D0] rounded border border-gold-muted/20 pl-9 pr-9 py-2.5 text-sm focus:border-gold-light focus:outline-none"
          aria-invalid={!resolved && query.length > 0}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-gold-muted animate-spin" />
          ) : resolved ? (
            <Check className="h-4 w-4 text-emerald-400" data-testid={`${id}-resolved`} />
          ) : null}
        </span>
      </div>

      {open && predictions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gold-muted/25 bg-obsidian-deep shadow-xl"
        >
          {predictions.map((pred) => (
            <li key={pred.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(pred)}
                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-gold-muted/10 hover:text-gold-light transition"
              >
                {pred.description}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-[11px] text-red-400 font-sans">{error}</p>}
      {!resolved && !error && query.trim().length > 0 && (
        <p className="text-[11px] text-amber-400/80 font-sans">
          Bitte einen Ort aus der Liste wählen, damit Koordinaten &amp; Zeitzone serverseitig aufgelöst werden.
        </p>
      )}
    </div>
  );
}
