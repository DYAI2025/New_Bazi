/**
 * BazodiacButton Component - Reusable, framework-agnostic vanilla HTML5 Web Component
 * Maintains the 'Planetarium Noir' design language and adapts dynamically to theme modes.
 */
export class BazodiacButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'glowing', 'loading', 'disabled', 'class', 'id', 'type'];
  }

  private buttonElement: HTMLButtonElement;
  private isInitialized = false;

  constructor() {
    super();
    this.buttonElement = document.createElement('button');
  }

  connectedCallback() {
    if (!this.isInitialized) {
      // Capture any initial light DOM children and move them into the button
      const fragment = document.createDocumentFragment();
      while (this.firstChild) {
        fragment.appendChild(this.firstChild);
      }
      this.buttonElement.appendChild(fragment);
      this.appendChild(this.buttonElement);
      this.isInitialized = true;
    }
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.isInitialized) {
      if (name === 'class' || name === 'id' || name === 'type') {
        // Handled in render
      }
      this.render();
    }
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const glowing = this.hasAttribute('glowing');
    const loading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled') || loading;
    const type = this.getAttribute('type') || 'button';
    const customId = this.getAttribute('id');
    const customClass = this.getAttribute('class') || '';

    // Assign standard/theme modes classes
    let baseClasses = "relative px-5 py-3.5 font-serif font-bold text-center tracking-widest rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer border flex items-center justify-center space-x-2 w-full select-none ";
    
    let variantClasses = "";
    if (variant === 'primary') {
      variantClasses = "bg-gradient-to-r from-gold-muted to-gold-dark hover:from-gold-light hover:to-gold-muted text-stone-950 border-gold-light/20 ";
    } else if (variant === 'secondary') {
      variantClasses = "bg-obsidian-card/75 hover:bg-gold-muted/15 text-gold-light border-gold-muted/20 hover:border-gold-muted/40 ";
    } else if (variant === 'ghost') {
      variantClasses = "bg-transparent hover:bg-gold-muted/10 text-gold-muted border-transparent ";
    } else if (variant === 'danger') {
      variantClasses = "bg-red-950/40 hover:bg-red-900/40 text-red-300 border-red-800/45 ";
    }

    if (glowing && variant === 'primary') {
      variantClasses += "glow-gold ";
    } else if (glowing) {
      variantClasses += "shadow-[0_0_15px_rgba(212,175,55,0.15)] ";
    }

    if (disabled) {
      variantClasses += "opacity-45 cursor-not-allowed pointer-events-none ";
    }

    // Set button classes and attributes
    this.buttonElement.className = `${baseClasses} ${variantClasses} ${customClass}`;
    this.buttonElement.type = type as any;
    
    if (customId) {
      this.buttonElement.id = `inner-${customId}`;
    }

    if (disabled) {
      this.buttonElement.setAttribute('disabled', 'true');
    } else {
      this.buttonElement.removeAttribute('disabled');
    }

    // Manage loader spinner element inside
    let spinner = this.buttonElement.querySelector('.bazodiac-spinner');
    if (loading) {
      if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = "bazodiac-spinner h-4 w-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin mr-2 shrink-0";
        if (variant !== 'primary') {
          spinner.className = "bazodiac-spinner h-4 w-4 border-2 border-gold-light border-t-transparent rounded-full animate-spin mr-2 shrink-0";
        }
        this.buttonElement.prepend(spinner);
      }
    } else if (spinner) {
      spinner.remove();
    }
  }
}
