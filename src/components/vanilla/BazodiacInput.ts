/**
 * BazodiacInput Component - Reusable, framework-agnostic vanilla HTML5 Web Component
 * Standardizes label styling, input states, validation attributes, and responsive borders.
 */
export class BazodiacInput extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'label', 'placeholder', 'value', 'options', 'icon', 'id', 'required', 'min', 'max', 'step', 'name', 'class'];
  }

  private isInitialized = false;
  private inputElement: HTMLInputElement | HTMLSelectElement | null = null;
  private containerElement: HTMLDivElement;

  constructor() {
    super();
    this.containerElement = document.createElement('div');
  }

  connectedCallback() {
    if (!this.isInitialized) {
      this.appendChild(this.containerElement);
      this.isInitialized = true;
    }
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.isInitialized) {
      // Avoid infinite loop if we set value programmatically
      if (name === 'value' && this.inputElement && this.inputElement.value === newValue) {
        return;
      }
      this.render();
    }
  }

  get value(): string {
    return this.inputElement ? this.inputElement.value : (this.getAttribute('value') || '');
  }

  set value(newValue: string) {
    this.setAttribute('value', newValue);
    if (this.inputElement) {
      this.inputElement.value = newValue;
    }
  }

  private getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      user: `<svg class="h-3.5 w-3.5 shrink-0 text-gold-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
      calendar: `<svg class="h-3.5 w-3.5 shrink-0 text-gold-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
      clock: `<svg class="h-3.5 w-3.5 shrink-0 text-gold-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      'map-pin': `<svg class="h-3.5 w-3.5 shrink-0 text-gold-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
      globe: `<svg class="h-3.5 w-3.5 shrink-0 text-gold-muted/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>`
    };
    return icons[iconName] || '';
  }

  render() {
    const type = this.getAttribute('type') || 'text';
    const label = this.getAttribute('label') || '';
    const placeholder = this.getAttribute('placeholder') || '';
    const initialValue = this.getAttribute('value') || '';
    const iconName = this.getAttribute('icon') || '';
    const customId = this.getAttribute('id') || `input-${Math.random().toString(36).substr(2, 9)}`;
    const required = this.hasAttribute('required');
    const min = this.getAttribute('min');
    const max = this.getAttribute('max');
    const step = this.getAttribute('step');
    const name = this.getAttribute('name') || '';
    const customClass = this.getAttribute('class') || '';
    const optionsAttr = this.getAttribute('options') || '';

    this.containerElement.className = `space-y-2 w-full ${customClass}`;

    let labelHtml = '';
    if (label) {
      const iconSvg = iconName ? this.getIconSvg(iconName) : '';
      labelHtml = `
        <label for="${customId}" class="font-mono text-[10px] uppercase font-bold text-gold-muted tracking-wider flex items-center space-x-1.5 select-none hover:text-gold-light transition duration-300">
          ${iconSvg}
          <span>${label}</span>
        </label>
      `;
    }

    let inputHtml = '';
    const fontClass = (type === 'date' || type === 'time' || type === 'number') ? 'font-mono' : 'font-sans';
    const baseInputClasses = `w-full bg-obsidian-deep/65 text-[#E0D8D0] rounded-lg border border-gold-muted/20 px-4 py-3 text-sm focus:border-gold-light focus:outline-none focus:ring-1 focus:ring-gold-muted/40 transition-all ${fontClass}`;

    if (type === 'select') {
      let optionsHtml = '';
      if (optionsAttr) {
        try {
          const parsedOptions = JSON.parse(optionsAttr);
          if (Array.isArray(parsedOptions)) {
            optionsHtml = parsedOptions.map((opt: any) => {
              const selectedStr = String(opt.value) === String(initialValue) ? 'selected' : '';
              return `<option class="bg-obsidian-card text-main-color" value="${opt.value}" ${selectedStr}>${opt.label || opt.value}</option>`;
            }).join('');
          }
        } catch (e) {
          console.error("Failed to parse options attribute", e);
        }
      }
      inputHtml = `
        <select
          id="${customId}"
          name="${name}"
          ${required ? 'required' : ''}
          class="${baseInputClasses} cursor-pointer"
        >
          ${optionsHtml}
        </select>
      `;
    } else {
      inputHtml = `
        <input
          id="${customId}"
          type="${type}"
          name="${name}"
          placeholder="${placeholder}"
          value="${initialValue.replace(/"/g, '&quot;')}"
          ${required ? 'required' : ''}
          ${min !== null && min !== undefined ? `min="${min}"` : ''}
          ${max !== null && max !== undefined ? `max="${max}"` : ''}
          ${step !== null && step !== undefined ? `step="${step}"` : ''}
          class="${baseInputClasses}"
        />
      `;
    }

    this.containerElement.innerHTML = `${labelHtml}${inputHtml}`;

    const oldInput = this.inputElement;
    this.inputElement = this.containerElement.querySelector(`#${customId}`) as HTMLInputElement | HTMLSelectElement;
    
    if (this.inputElement) {
      const handleEventAction = (e: Event) => {
        const val = (e.target as any).value;
        this.setAttribute('value', val);
        this.dispatchEvent(new CustomEvent('change', {
          bubbles: true,
          detail: { value: val }
        }));
      };

      this.inputElement.addEventListener('input', handleEventAction);
      this.inputElement.addEventListener('change', handleEventAction);
    }
  }
}
