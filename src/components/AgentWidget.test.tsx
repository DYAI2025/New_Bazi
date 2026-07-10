// AgentWidget — Eve & Levi ConvAI-Verdrahtung.
// jsdom kennt das <elevenlabs-convai>-Custom-Element nicht als Klasse, aber
// createElement/appendChild funktionieren — genau das prüfen wir: Mount,
// Attribute, Unmount-Cleanup und der ehrliche Hidden-State ohne Agent-IDs.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

import AgentWidget from "./AgentWidget";

let container: HTMLElement;
let root: Root;

function render(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(ui));
}

function cleanup() {
  act(() => root.unmount());
  container.remove();
}

function convaiEls(): NodeListOf<Element> {
  return document.body.querySelectorAll("elevenlabs-convai");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  // Basiszustand deterministisch machen: lokale .env-Dateien können echte
  // Agent-IDs enthalten (Vite injiziert sie in import.meta.env) — jeder Test
  // startet ohne konfigurierte Agenten und stubbt gezielt, was er braucht.
  vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_LEVI", "");
  vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_EVE", "");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("AgentWidget", () => {
  it("rendert nichts, wenn keine Agent-ID konfiguriert ist (ehrlicher Hidden-State)", () => {
    render(<AgentWidget viewModel={null} />);
    expect(container.querySelector('[data-testid="agent-widget"]')).toBeNull();
  });

  it("zeigt die Pille und mountet das ConvAI-Element beim Start eines Agenten", () => {
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_LEVI", "agent_test_levi");
    render(<AgentWidget viewModel={null} />);

    // Pille sichtbar, noch kein ConvAI-Element
    const pill = container.querySelector('[data-testid="agent-widget-pill"]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(convaiEls().length).toBe(0);

    // Aufklappen → nur Levi angeboten (Eve ohne ID bleibt verborgen)
    act(() => pill.click());
    expect(container.querySelector('[data-testid="agent-call-levi"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="agent-call-eve"]')).toBeNull();

    // Start → genau EIN <elevenlabs-convai> mit korrekter agent-id am body
    act(() => (container.querySelector('[data-testid="agent-call-levi"]') as HTMLElement).click());
    expect(convaiEls().length).toBe(1);
    expect(convaiEls()[0].getAttribute("agent-id")).toBe("agent_test_levi");

    // Beenden → Element wieder entfernt
    act(() => (container.querySelector('[data-testid="agent-call-levi"]') as HTMLElement).click());
    expect(convaiEls().length).toBe(0);
  });

  it("übergibt Profil-Anker als dynamic-variables (nur VORNAME) und räumt beim Unmount auf", () => {
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_EVE", "agent_test_eve");
    const vm = {
      identity: { name: "Ada Lovelace" },
      western: { sunSign: "Steinbock" },
      bazi: { dayMaster: { element: "Wasser" } },
    } as any;
    render(<AgentWidget viewModel={vm} />);

    act(() => (container.querySelector('[data-testid="agent-widget-pill"]') as HTMLElement).click());
    act(() => (container.querySelector('[data-testid="agent-call-eve"]') as HTMLElement).click());

    const el = convaiEls()[0];
    expect(el).toBeDefined();
    const vars = JSON.parse(el.getAttribute("dynamic-variables") ?? "{}");
    // Datensparsamkeit: voller Name geht NIE raus — nur der Vorname.
    expect(vars).toEqual({ user_name: "Ada", sun_sign: "Steinbock", day_master: "Wasser" });

    // Unmount der React-App → imperativ gemountetes Element verschwindet mit
    act(() => root.unmount());
    expect(convaiEls().length).toBe(0);
    // afterEach-cleanup ruft unmount erneut — idempotent, kein Fehler erwartet
  });

  it("lädt das ConvAI-Script erst beim Agent-Start (dynamische Injection)", () => {
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_LEVI", "agent_test_levi");
    document.querySelector("script[data-convai-loader]")?.remove();
    render(<AgentWidget viewModel={null} />);

    // Vor dem Start: kein Dritt-Script im Dokument (Supply-Chain-Gate).
    expect(document.querySelector("script[data-convai-loader]")).toBeNull();

    act(() => (container.querySelector('[data-testid="agent-widget-pill"]') as HTMLElement).click());
    expect(document.querySelector("script[data-convai-loader]")).toBeNull();

    act(() => (container.querySelector('[data-testid="agent-call-levi"]') as HTMLElement).click());
    const script = document.querySelector("script[data-convai-loader]") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toBe("https://elevenlabs.io/convai-widget/index.js");
  });

  it("aktualisiert dynamic-variables in-place ohne Remount, wenn sich das Profil ändert", () => {
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_LEVI", "agent_test_levi");
    const vm1 = { identity: { name: "Ada" }, western: { sunSign: "Steinbock" }, bazi: { dayMaster: { element: "Wasser" } } } as any;
    render(<AgentWidget viewModel={vm1} />);
    act(() => (container.querySelector('[data-testid="agent-widget-pill"]') as HTMLElement).click());
    act(() => (container.querySelector('[data-testid="agent-call-levi"]') as HTMLElement).click());

    const before = convaiEls()[0];
    const vm2 = { identity: { name: "Grace" }, western: { sunSign: "Zwillinge" }, bazi: { dayMaster: { element: "Feuer" } } } as any;
    act(() => root.render(<AgentWidget viewModel={vm2} />));

    // Gleiches DOM-Element (kein Remount), aber frische Variablen.
    expect(convaiEls().length).toBe(1);
    expect(convaiEls()[0]).toBe(before);
    const vars = JSON.parse(convaiEls()[0].getAttribute("dynamic-variables") ?? "{}");
    expect(vars.user_name).toBe("Grace");
    expect(vars.sun_sign).toBe("Zwillinge");
  });

  it("wechselt Levi→Eve ohne Element-Leiche (Remount-Race aus dem Astro-Noctum-Port)", () => {
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_LEVI", "agent_test_levi");
    vi.stubEnv("VITE_ELEVENLABS_AGENT_ID_EVE", "agent_test_eve");
    render(<AgentWidget viewModel={null} />);
    act(() => (container.querySelector('[data-testid="agent-widget-pill"]') as HTMLElement).click());

    act(() => (container.querySelector('[data-testid="agent-call-levi"]') as HTMLElement).click());
    expect(convaiEls().length).toBe(1);
    expect(convaiEls()[0].getAttribute("agent-id")).toBe("agent_test_levi");

    act(() => (container.querySelector('[data-testid="agent-call-eve"]') as HTMLElement).click());
    expect(convaiEls().length).toBe(1);
    expect(convaiEls()[0].getAttribute("agent-id")).toBe("agent_test_eve");
  });
});
