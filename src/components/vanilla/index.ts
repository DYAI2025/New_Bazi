import { BazodiacButton } from "./BazodiacButton";
import { BazodiacCard } from "./BazodiacCard";
import { BazodiacInput } from "./BazodiacInput";

export { BazodiacButton, BazodiacCard, BazodiacInput };

// Register the custom elements with the browser
if (typeof window !== "undefined" && !window.customElements.get("bazodiac-button")) {
  window.customElements.define("bazodiac-button", BazodiacButton);
  window.customElements.define("bazodiac-card", BazodiacCard);
  window.customElements.define("bazodiac-input", BazodiacInput);
}
