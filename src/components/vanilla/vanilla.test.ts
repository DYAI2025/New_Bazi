import { describe, it, expect, beforeEach } from "vitest";
import "./index"; // registers custom elements

describe("Bazodiac Web Components Unit Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("bazodiac-button", () => {
    it("should register of tag custom elements", () => {
      const element = document.createElement("bazodiac-button");
      expect(element).toBeInstanceOf(HTMLElement);
    });

    it("should render inner button with correct primary accent classes", () => {
      const button = document.createElement("bazodiac-button");
      button.setAttribute("variant", "primary");
      button.innerText = "Connect Souls";
      document.body.appendChild(button);

      const inner = button.querySelector("button");
      expect(inner).not.toBeNull();
      expect(inner?.className).toContain("from-gold-muted");
      expect(inner?.className).toContain("to-gold-dark");
    });

    it("should apply disabled attribute and classes on loading", () => {
      const button = document.createElement("bazodiac-button");
      button.setAttribute("loading", "");
      button.innerText = "Calculating...";
      document.body.appendChild(button);

      const inner = button.querySelector("button");
      expect(inner?.hasAttribute("disabled")).toBe(true);
      expect(inner?.className).toContain("cursor-not-allowed");
      expect(inner?.className).toContain("opacity-45");
      
      const spinner = inner?.querySelector(".bazodiac-spinner");
      expect(spinner).not.toBeNull();
    });
  });

  describe("bazodiac-card", () => {
    it("should render glass card by default", () => {
      const card = document.createElement("bazodiac-card");
      document.body.appendChild(card);

      const div = card.querySelector("div");
      expect(div?.className).toContain("glass-card");
    });

    it("should render solid style card", () => {
      const card = document.createElement("bazodiac-card");
      card.setAttribute("variant", "solid");
      document.body.appendChild(card);

      const div = card.querySelector("div");
      expect(div?.className).toContain("bg-obsidian-card");
    });

    it("should apply golden passive glows on glowing option activation", () => {
      const card = document.createElement("bazodiac-card");
      card.setAttribute("glowing", "");
      document.body.appendChild(card);

      const div = card.querySelector("div");
      expect(div?.className).toContain("glow-gold-lg");
    });
  });

  describe("bazodiac-input", () => {
    it("should render standard texts input with label and helper symbol", () => {
      const input = document.createElement("bazodiac-input");
      input.setAttribute("type", "text");
      input.setAttribute("label", "Geistiger Name");
      input.setAttribute("placeholder", "z.B. Alexis");
      input.setAttribute("icon", "user");
      document.body.appendChild(input);

      const label = input.querySelector("label");
      expect(label).not.toBeNull();
      expect(label?.innerHTML).toContain("Geistiger Name");
      expect(label?.innerHTML).toContain("svg"); // contains custom user icon SVG

      const textInput = input.querySelector("input");
      expect(textInput).not.toBeNull();
      expect(textInput?.getAttribute("type")).toBe("text");
      expect(textInput?.getAttribute("placeholder")).toBe("z.B. Alexis");
    });

    it("should render native select grid when options JSON supplied", () => {
      const input = document.createElement("bazodiac-input");
      input.setAttribute("type", "select");
      input.setAttribute("label", "Alignment");
      input.setAttribute("value", "Yin");
      input.setAttribute(
        "options",
        JSON.stringify([
          { value: "Yin", label: "Yin Harmony" },
          { value: "Yang", label: "Yang Accent" }
        ])
      );
      document.body.appendChild(input);

      const select = input.querySelector("select");
      expect(select).not.toBeNull();
      expect(select?.value).toBe("Yin");
      expect(select?.options.length).toBe(2);
    });

    it("should dispatch standard native change events when user inputs", () => {
      const input = document.createElement("bazodiac-input");
      input.setAttribute("type", "text");
      input.setAttribute("value", "initial");
      document.body.appendChild(input);

      let eventReceived: string | null = null;
      input.addEventListener("change", (e: any) => {
        eventReceived = e.detail.value;
      });

      const textInput = input.querySelector("input");
      if (textInput) {
        textInput.value = "spirit";
        textInput.dispatchEvent(new Event("input"));
      }

      expect(eventReceived).toBe("spirit");
      expect(input.getAttribute("value")).toBe("spirit");
    });
  });
});
