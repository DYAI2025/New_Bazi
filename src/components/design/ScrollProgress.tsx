import React from "react";

/**
 * Thin top scroll-progress line — ORIENTATION, not gamified scarcity (council/brief).
 * Pure scroll-position read; width only, no transform. Honours reduced-motion via the
 * global CSS rule (transition collapses). data-testid for e2e.
 */
export default function ScrollProgress({ targetId }: { targetId?: string }) {
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    const el = targetId ? document.getElementById(targetId) : null;
    const compute = () => {
      const scrollTop = window.scrollY;
      const max = el
        ? el.scrollHeight - window.innerHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      setPct(ratio * 100);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      data-testid="scroll-progress"
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--color-gold-leaf-from), var(--color-gold-leaf-to))" }}
      />
    </div>
  );
}
