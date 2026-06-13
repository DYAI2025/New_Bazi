import React from "react";
import { BirthData } from "../types";
import { Compass, Sparkles, ShieldCheck, User, Calendar, Clock } from "lucide-react";
import PlaceAutocomplete from "./PlaceAutocomplete";
import { ResolvedPlace } from "../api/bazodiacClient";

interface InputFormProps {
  birthData: BirthData | null;
  onCalculate: (data: BirthData) => void;
  timeError?: string | null;
}

const EMPTY: BirthData = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  birthPlaceLabel: "",
  placeId: "",
  gender: "Divers"
};

const FIELD_CLASS =
  "w-full bg-obsidian-deep/65 text-[#E0D8D0] rounded-lg border border-gold-muted/20 px-4 py-3 text-sm focus:border-gold-light focus:outline-none focus:ring-1 focus:ring-gold-muted/40 transition-all";
const LABEL_CLASS =
  "font-mono text-[10px] uppercase font-bold text-gold-muted tracking-wider flex items-center space-x-1.5 select-none mb-2";

export default function InputForm({ birthData, onCalculate, timeError = null }: InputFormProps) {
  const [formData, setFormData] = React.useState<BirthData>({ ...EMPTY, ...(birthData || {}) });
  const [submitting, setSubmitting] = React.useState(false);
  const [timeKnown, setTimeKnown] = React.useState<boolean>(birthData?.timeKnown ?? true);

  const placeResolved = Boolean(
    formData.placeId &&
    typeof formData.lat === "number" &&
    typeof formData.lon === "number" &&
    Boolean(formData.tz)
  );

  const canSubmit =
    formData.name.trim().length >= 2 &&
    Boolean(formData.birthDate) &&
    (timeKnown ? Boolean(formData.birthTime) : true) &&
    placeResolved;

  const handleResolved = (place: ResolvedPlace) => {
    setFormData((prev) => ({
      ...prev,
      placeId: place.placeId,
      birthPlaceLabel: place.label,
      birthPlace: place.label,
      lat: place.lat,
      lon: place.lon,
      tz: place.tz
    }));
  };

  const handleClearPlace = () => {
    setFormData((prev) => ({ ...prev, placeId: "", lat: undefined, lon: undefined, tz: undefined }));
  };

  const handleTimeUnknownChange = (checked: boolean) => {
    setTimeKnown(!checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, birthTime: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    onCalculate({ ...formData, timeKnown });
    setTimeout(() => setSubmitting(false), 600);
  };

  return (
    <div id="input-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Intro */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Compass className="h-40 w-40 text-gold-muted" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-gold-light mb-4">Bazodiac</h2>
          <p className="text-sm text-stone-400 leading-relaxed font-sans mb-4">
            <strong className="text-gold-muted font-medium">Bazodiac</strong> verbindet westliche Astrologie und
            chinesisches BaZi zu einem gemeinsamen Bild. Positionen und Säulen werden serverseitig über die
            FuFirE-Engine berechnet.
          </p>
          <p className="text-xs text-stone-500 leading-relaxed">
            Geben Sie Ihre echten Geburtskoordinaten ein. Der Ort wird über die Vorschlagsliste serverseitig in
            Breitengrad, Längengrad und Zeitzone aufgelöst — ohne korrekt aufgelösten Ort bleibt die Berechnung gesperrt.
          </p>
          <div className="mt-6 pt-6 border-t border-gold-muted/10 flex items-start space-x-2.5">
            <ShieldCheck className="h-4 w-4 text-gold-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
              Keine Demo- oder Beispielprofile. Alle Schlüssel bleiben serverseitig; der Browser ruft FuFirE niemals direkt.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-8">
        <form onSubmit={handleSubmit} className="space-y-6 relative h-full">
          <div className="glass-card p-6 sm:p-8 space-y-6 rounded-2xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-gold-muted/10 mb-6">
              <Sparkles className="h-6 w-6 text-gold-muted" />
              <h3 className="font-serif text-2xl font-bold text-gold-light">Kosmische Koordinaten erfassen</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="input-name" className={LABEL_CLASS}>
                  <User className="h-3.5 w-3.5 text-gold-muted/80" /> <span>Vollständiger Name</span>
                </label>
                <input
                  id="input-name"
                  type="text"
                  required
                  placeholder="z.B. Alexis Vane"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label htmlFor="input-gender" className={LABEL_CLASS}><span>Geschlecht</span></label>
                <select
                  id="input-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className={`${FIELD_CLASS} cursor-pointer`}
                >
                  <option value="Weiblich">Weiblich</option>
                  <option value="Männlich">Männlich</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>

              <div>
                <label htmlFor="input-date" className={LABEL_CLASS}>
                  <Calendar className="h-3.5 w-3.5 text-gold-muted/80" /> <span>Geburtsdatum</span>
                </label>
                <input
                  id="input-date"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className={`${FIELD_CLASS} font-mono`}
                />
              </div>

              <div>
                <label htmlFor="input-time" className={LABEL_CLASS}>
                  <Clock className="h-3.5 w-3.5 text-gold-muted/80" /> <span>Geburtszeit (Lokalzeit)</span>
                </label>
                <input
                  id="input-time"
                  type="time"
                  required={timeKnown}
                  disabled={!timeKnown}
                  value={timeKnown ? formData.birthTime : ""}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  aria-invalid={!!timeError}
                  aria-describedby={timeError ? "time-field-error" : undefined}
                  className={`${FIELD_CLASS} font-mono disabled:opacity-45 disabled:cursor-not-allowed`}
                />
                <div className="mt-3 flex items-start gap-2.5">
                  <input
                    id="input-time-unknown"
                    type="checkbox"
                    checked={!timeKnown}
                    onChange={(e) => handleTimeUnknownChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gold-muted/30 bg-obsidian-deep/65 text-gold-muted focus:ring-gold-muted/40"
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="input-time-unknown"
                      className="cursor-pointer select-none text-xs font-sans font-medium text-stone-300"
                    >
                      Geburtszeit unbekannt
                    </label>
                    {!timeKnown && (
                      <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                        Wir verwenden Tagesmitte (12:00) als technischen Platzhalter und markieren zeitabhängige
                        Deutungen als unsicher.
                      </p>
                    )}
                  </div>
                </div>
                {timeError && (
                  <p
                    id="time-field-error"
                    className="mt-1.5 text-[11px] text-red-400 font-sans leading-relaxed"
                    data-testid="time-field-error"
                  >
                    {timeError}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <PlaceAutocomplete
                  id="input-place"
                  label="Geburtsort (serverseitig aufgelöst)"
                  value={formData.birthPlaceLabel || ""}
                  resolved={placeResolved}
                  onResolved={handleResolved}
                  onClear={handleClearPlace}
                />
                {placeResolved && (
                  <p className="mt-1.5 font-mono text-[10px] text-emerald-400/80" data-testid="place-coords">
                    {formData.lat?.toFixed(4)}, {formData.lon?.toFixed(4)} · {formData.tz}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                id="submit-calculate-btn"
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full relative px-5 py-3.5 font-serif font-bold tracking-widest rounded-xl transition-all duration-300 transform active:scale-95 border flex items-center justify-center space-x-2 bg-gradient-to-r from-gold-muted to-gold-dark hover:from-gold-light hover:to-gold-muted text-stone-950 border-gold-light/20 glow-gold disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {submitting ? (
                  <span>PLANETENGRID WIRD SYNCHRONISIERT...</span>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 p-0.5 text-stone-950" />
                    <span>KOSMISCHES SPEKTRUM ERRECHNEN</span>
                  </>
                )}
              </button>
              {!canSubmit && (
                <p className="mt-3 text-[11px] text-stone-500 font-sans text-center">
                  Name, Datum, {timeKnown ? "Zeit und " : ""}ein aufgelöster Ort (lat/lon/tz) sind erforderlich.
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
