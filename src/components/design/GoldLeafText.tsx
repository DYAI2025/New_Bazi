import React from "react";

interface GoldLeafTextProps {
  as?: "span" | "h1" | "h2" | "h3";
  className?: string;
  children?: React.ReactNode;
}

/** Gold-leaf gradient text (calc/form identity). Wraps the existing `.gold-text-gradient`. */
export default function GoldLeafText({ as: Tag = "span", className = "", children }: GoldLeafTextProps) {
  return <Tag className={`gold-text-gradient ${className}`}>{children}</Tag>;
}
