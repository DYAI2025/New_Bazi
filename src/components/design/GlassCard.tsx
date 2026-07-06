import React from "react";

interface GlassCardProps {
  /** Soft gold glow (calc/form accent) vs. blue glow (movement/question accent). */
  accent?: "gold" | "blue" | "none";
  // React's special `key` is not auto-injected for this repo's explicitly-typed
  // components, so declare it here for use in lists (React still handles it specially).
  key?: React.Key;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  "data-testid"?: string;
}

/**
 * Redesign glass surface — wraps the existing `.glass-card` utility (backdrop blur +
 * token-driven border/shadow) and adds an optional semantic accent shadow. Presentational
 * only; no data, no motion transforms.
 */
export default function GlassCard({ accent = "none", className = "", style, children, "data-testid": testId }: GlassCardProps) {
  const accentShadow =
    accent === "gold" ? "var(--shadow-gold-soft)" : accent === "blue" ? "var(--shadow-blue-soft)" : undefined;
  return (
    <div
      data-testid={testId}
      className={`glass-card rounded-2xl ${className}`}
      style={accentShadow ? { boxShadow: accentShadow, ...style } : style}
    >
      {children}
    </div>
  );
}
