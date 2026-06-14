// Pure SVG ring geometry for the redesign FusionHero — re-housed identically from
// TensionNavigator.tsx (the single conceptual source; this copy is pinned by polar.test.ts
// and the existing tension-navigator e2e so the two cannot silently drift). No React, no IO.
// Hard rule (PR #14): geometry is static SVG; animate only via CSS opacity/stroke — never
// framer-motion transforms on these paths.

export interface Point {
  x: number;
  y: number;
}

/** Polar→cartesian with 0° = top (12 o'clock), clockwise. */
export function polar(cx: number, cy: number, r: number, deg: number): Point {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Quadratic-bezier arc between two ring points, bowed by `curv` perpendicular px. */
export function curvePath(p1: Point, p2: Point, curv: number): string {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${(mx + (-dy / len) * curv).toFixed(1)} ${(my + (dx / len) * curv).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

export function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

function hex(n: number): string {
  return Math.round(n).toString(16).padStart(2, "0");
}

/**
 * Gold↔Blau blend: t=1 → Gold (#d9b86d, Form/West), t=0 → Blau (#27c8ee, Fluss/BaZi).
 * Colour carries polarity, NEVER good/bad. Identical to TensionNavigator.blend.
 */
export function blend(t: number): string {
  t = clamp(t, 0, 1);
  const gold = [217, 184, 109];
  const blue = [39, 200, 238];
  return `#${hex(blue[0] + (gold[0] - blue[0]) * t)}${hex(blue[1] + (gold[1] - blue[1]) * t)}${hex(blue[2] + (gold[2] - blue[2]) * t)}`;
}
