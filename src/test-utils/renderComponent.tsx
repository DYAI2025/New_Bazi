import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let root: Root | null = null;
let container: HTMLElement | null = null;

export function renderComponent(ui: React.ReactElement): HTMLElement {
  if (root) throw new Error("renderComponent(): previous mount still active — call cleanupComponent() first");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(ui));
  return container;
}

export function cleanupComponent(): void {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = null;
  container = null;
}

export function clickTestId(c: HTMLElement, testId: string): void {
  const el = c.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
  if (!el) throw new Error(`[data-testid="${testId}"] nicht gefunden`);
  act(() => el.click());
}
