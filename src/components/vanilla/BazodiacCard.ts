/**
 * BazodiacCard Component - Reusable, framework-agnostic vanilla HTML5 Web Component
 * Encapsulates the luxury Bazodiac borders, glass/solid variants, and glow styles.
 */
export class BazodiacCard extends HTMLElement {
  static get observedAttributes() {
    return ['hoverable', 'glowing', 'variant', 'class', 'id'];
  }

  private isInitialized = false;
  private containerElement: HTMLDivElement;

  constructor() {
    super();
    this.containerElement = document.createElement('div');
  }

  connectedCallback() {
    if (!this.isInitialized) {
      // Move all children elements into the wrapper div
      const fragment = document.createDocumentFragment();
      while (this.firstChild) {
        fragment.appendChild(this.firstChild);
      }
      this.containerElement.appendChild(fragment);
      this.appendChild(this.containerElement);
      this.isInitialized = true;
    }
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.isInitialized) {
      this.render();
    }
  }

  render() {
    const hoverable = this.hasAttribute('hoverable');
    const glowing = this.hasAttribute('glowing');
    const variant = this.getAttribute('variant') || 'glass';
    const customClass = this.getAttribute('class') || '';
    const customId = this.getAttribute('id');

    let baseClasses = "rounded-2xl p-6 relative transition-all duration-500 ease-out border ";
    
    let variantClasses = "";
    if (variant === 'glass') {
      variantClasses = "glass-card ";
    } else if (variant === 'solid') {
      variantClasses = "bg-obsidian-card text-main-color border-gold-muted/15 shadow-[0_12px_40px_rgba(0,0,0,0.65)] ";
      if (hoverable) {
        variantClasses += "hover:border-gold-muted/30 hover:shadow-lg hover:-translate-y-0.5 ";
      }
    } else if (variant === 'thin') {
      variantClasses = "bg-obsidian-deep/40 border-gold-muted/10 ";
      if (hoverable) {
        variantClasses += "hover:border-gold-muted/20 ";
      }
    }

    if (glowing) {
      variantClasses += "glow-gold-lg ";
    }

    this.containerElement.className = `${baseClasses} ${variantClasses} ${customClass}`;
    if (customId) {
      this.containerElement.id = `inner-${customId}`;
    }
  }
}
