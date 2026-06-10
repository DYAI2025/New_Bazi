declare module "tz-lookup" {
  /** Returns the IANA timezone id (e.g. "Europe/Berlin") for a coordinate. Throws RangeError on invalid coordinates. */
  export default function tzlookup(lat: number, lon: number): string;
}
