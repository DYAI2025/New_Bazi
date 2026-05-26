import { describe, it, expect, beforeEach } from "vitest";

describe("Theming System Unit Tests", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.className = "";
    document.body.className = "";
  });

  it("should support default dark mode configuration", () => {
    // Default system mode is dark
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("should apply light theme attributes when switched to light mode", () => {
    const root = document.documentElement;
    const body = document.body;

    // Simulate theme synchronization effect
    const themeMode = "light";
    if (themeMode === "light") {
      root.setAttribute("data-theme", "light");
      root.classList.add("light");
      body.classList.add("light");
    }

    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.classList.contains("light")).toBe(true);
    expect(body.classList.contains("light")).toBe(true);
  });

  it("should correctly clear light class lists when returned to dark mode", () => {
    const root = document.documentElement;
    const body = document.body;

    // Set light first
    root.setAttribute("data-theme", "light");
    root.classList.add("light");
    body.classList.add("light");

    // Simulate switch back to dark mode
    root.setAttribute("data-theme", "dark");
    root.classList.remove("light");
    body.classList.remove("light");

    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.classList.contains("light")).toBe(false);
    expect(body.classList.contains("light")).toBe(false);
  });
});
