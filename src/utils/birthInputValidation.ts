/**
 * Server-side validation for birth input before any FuFirE call.
 * No FuFirE request may be issued with incomplete or fabricated data.
 */

export interface BirthInputCandidate {
  name?: unknown;
  birthDate?: unknown;
  birthTime?: unknown;
  placeId?: unknown;
  birthPlaceLabel?: unknown;
  lat?: unknown;
  lon?: unknown;
  tz?: unknown;
  gender?: unknown;
  timeKnown?: boolean;
}

export interface ValidatedBirthInput {
  name: string;
  birthDate: string;
  birthTime: string;
  placeId: string;
  birthPlaceLabel: string;
  lat: number;
  lon: number;
  tz: string;
  gender: string;
  timeKnown: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
  value?: ValidatedBirthInput;
}

// Demo / reference profiles must never be accepted as real birth data.
// NUR fiktive/historische Referenznamen — niemals reale Nutzernamen sperren
// (2026-07-09: "benjamin pörsch/poersch" entfernt; der Guard hatte den echten
// Nutzer der App ausgesperrt, weil Dev-Testdaten seinen Namen verwendeten).
const BARRED_NAMES = new Set([
  "goethe",
  "johann wolfgang von goethe",
  "marie curie",
  "curie"
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidIanaTimezone(tz: string): boolean {
  if (!tz || !tz.includes("/")) return false;
  try {
    // Throws RangeError for an unknown/invalid IANA id.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function validateBirthInput(input: BirthInputCandidate): ValidationResult {
  const errors: FieldError[] = [];

  // --- name ---
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    errors.push({ field: "name", message: "Der Name muss zwischen 2 und 80 Zeichen lang sein." });
  } else if (BARRED_NAMES.has(name.toLowerCase())) {
    errors.push({ field: "name", message: "Demo-Profile und fiktive Referenznamen sind als Geburtsdaten unzulaessig." });
  }

  // --- birthDate ---
  const birthDate = typeof input.birthDate === "string" ? input.birthDate.trim() : "";
  if (!DATE_RE.test(birthDate)) {
    errors.push({ field: "birthDate", message: "Bitte ein gueltiges Geburtsdatum im Format YYYY-MM-DD angeben." });
  } else {
    const parsed = new Date(`${birthDate}T00:00:00Z`);
    const roundTrips = !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === birthDate;
    if (!roundTrips) {
      errors.push({ field: "birthDate", message: "Das Geburtsdatum ist kein gueltiger Kalendertag." });
    } else if (parsed.getTime() > Date.now()) {
      errors.push({ field: "birthDate", message: "Das Geburtsdatum darf nicht in der Zukunft liegen." });
    }
  }

  // --- birthTime ---
  const timeKnown = input.timeKnown !== false;
  let birthTime: string;
  if (!timeKnown) {
    birthTime = "12:00";
  } else {
    birthTime = typeof input.birthTime === "string" ? input.birthTime.trim() : "";
    if (!TIME_RE.test(birthTime)) {
      errors.push({ field: "birthTime", message: "Bitte eine gueltige Geburtszeit im Format HH:mm angeben." });
    }
  }

  // --- placeId ---
  const placeId = typeof input.placeId === "string" ? input.placeId.trim() : "";
  if (!placeId) {
    errors.push({ field: "placeId", message: "Bitte einen Geburtsort aus der Vorschlagsliste waehlen (placeId fehlt)." });
  }

  // --- lat ---
  // Accept number or numeric string only; booleans/arrays/objects must not coerce
  // silently (Number(true) === 1, Number([5]) === 5) into a "valid" coordinate.
  const lat = typeof input.lat === "number" ? input.lat
    : typeof input.lat === "string" ? Number(input.lat)
    : NaN;
  if (input.lat === undefined || input.lat === null || Number.isNaN(lat)) {
    errors.push({ field: "lat", message: "Breitengrad (lat) fehlt. Ort serverseitig aufloesen." });
  } else if (lat < -90 || lat > 90) {
    errors.push({ field: "lat", message: "Breitengrad (lat) liegt ausserhalb des gueltigen Bereichs (-90..90)." });
  }

  // --- lon ---
  const lon = typeof input.lon === "number" ? input.lon
    : typeof input.lon === "string" ? Number(input.lon)
    : NaN;
  if (input.lon === undefined || input.lon === null || Number.isNaN(lon)) {
    errors.push({ field: "lon", message: "Laengengrad (lon) fehlt. Ort serverseitig aufloesen." });
  } else if (lon < -180 || lon > 180) {
    errors.push({ field: "lon", message: "Laengengrad (lon) liegt ausserhalb des gueltigen Bereichs (-180..180)." });
  }

  // Reject the classic fake 0/0 "Null Island" coordinate as a missing-location signal.
  if (!Number.isNaN(lat) && !Number.isNaN(lon) && lat === 0 && lon === 0) {
    errors.push({ field: "lat", message: "Koordinaten 0/0 sind kein gueltiger Geburtsort." });
  }

  // --- tz ---
  const tz = typeof input.tz === "string" ? input.tz.trim() : "";
  if (!tz) {
    errors.push({ field: "tz", message: "Zeitzone (tz) fehlt. Ort serverseitig aufloesen." });
  } else if (!isValidIanaTimezone(tz)) {
    errors.push({ field: "tz", message: "Zeitzone (tz) ist keine gueltige IANA-Zeitzonen-ID." });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: {
      name,
      birthDate,
      birthTime,
      placeId,
      birthPlaceLabel: typeof input.birthPlaceLabel === "string" ? input.birthPlaceLabel.trim() : "",
      lat,
      lon,
      tz,
      gender: typeof input.gender === "string" && input.gender.trim() ? input.gender.trim() : "Divers",
      timeKnown,
    }
  };
}
