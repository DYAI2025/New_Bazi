import React from "react";

interface SectionShellProps {
  /** Mono eyebrow label above the heading (orientation, not marketing). */
  eyebrow?: string;
  heading?: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  "data-testid"?: string;
}

/**
 * Vertical rhythm + max-width container for a landing section. Heading optional so a
 * section can be purely visual (hero). No animation here — sections opt into in-view
 * reveals at the call site (opacity only, reduced-motion safe).
 */
export default function SectionShell({ eyebrow, heading, intro, className = "", children, id, "data-testid": testId }: SectionShellProps) {
  return (
    <section id={id} data-testid={testId} className={`mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16 ${className}`}>
      {(eyebrow || heading || intro) && (
        <header className="mb-8 space-y-2">
          {eyebrow && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-muted">{eyebrow}</span>
          )}
          {heading && <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gold-light">{heading}</h2>}
          {intro && <p className="max-w-2xl text-sm leading-relaxed text-stone-400">{intro}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
