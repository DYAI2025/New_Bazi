# BazodiacButton Component (`<bazodiac-button>`)

The `<bazodiac-button>` component is a high-performance, framework-agnostic vanilla ESM Web Component built in the 'Planetarium Noir' design system language. It handles secondary microinteraction flows, triggers deep calculation processes, and supports loading states natively.

---

## Technical Specifications

### Custom Element Tag
`bazodiac-button`

### Attributes & Properties

| Attribute | TypeScript Type | Allowed Values | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `string` | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | High-contrast visual style matching the active cosmos mode. |
| `glowing` | `boolean` | `present \| absent` | `absent` | Emits an active ambient golden glow (`glow-gold` filter). |
| `loading` | `boolean` | `present \| absent` | `absent` | Swaps the text structure with an active cosmic spinning loader. |
| `disabled`| `boolean` | `present \| absent` | `absent` | Drops pointer events and reduces rendering opacity to 45%. |
| `type`     | `string` | `"button" \| "submit" \| "reset"` | `"button"` | Configures standard browser submit actions. |

---

## Plain HTML / Vanilla ESM Usage

Ensure `/src/components/vanilla/index.ts` (or the compiled output) is loaded:

```html
<!-- Import compiled component module -->
<script type="module" src="./components/vanilla/index.ts"></script>

<!-- Render primary button -->
<bazodiac-button id="btn-calc" variant="primary" glowing>
  KOSMISCHES SPEKTRUM ERRECHNEN
</bazodiac-button>

<!-- Render loading ghost button -->
<bazodiac-button variant="ghost" loading disabled>
  SYNCHRONISIEREN...
</bazodiac-button>
```

---

## React Usage (using React Wrapper)

The component is pre-wrapped as a native React forwardRef component for seamless JSX typing and state mapping.

```tsx
import { Button } from "./components/vanilla/ReactWrappers";

export default function App() {
  const [isSyncing, setIsSyncing] = React.useState(false);

  return (
    <Button 
      variant="primary" 
      glowing 
      loading={isSyncing}
      onClick={() => setIsSyncing(true)}
    >
      KOSMISCHES SPEKTRUM ERRECHNEN
    </Button>
  );
}
```

---

## Theme Adaptability

The button component references pure CSS variables defined by the Bazodiac Theming Engine:
- **Primary Variant**: Renders with continuous gradient styles `bg-gradient-to-r from-gold-muted to-gold-dark`.
- **Secondary Variant**: Utilizes responsive colors mapping automatic backgrounds `bg-obsidian-card` (which switches seamlessly from `#0d0d12` under *Planetarium Noir* to `#EFECE7` under *Solar Aura*).
- **Disabled State**: Opacity falls accurately to meets contrast ratios of WCAG criteria.
