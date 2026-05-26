# BazodiacCard Component (`<bazodiac-card>`)

The `<bazodiac-card>` component is a layout-shaping Web Component that provides luxury containment. It encapsulates the core glassmorphism surfaces of Bazodiac, responsive borders, dynamic hovers, and cosmic dark aesthetics.

---

## Technical Specifications

### Custom Element Tag
`bazodiac-card`

### Attributes & Properties

| Attribute | TypeScript Type | Allowed Values | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `string` | `"glass" \| "solid" \| "thin"` | `"glass"` | Structural outline & glass backdrop selection. |
| `hoverable`| `boolean`| `present \| absent` | `absent` | Active hover lift (+z-axis shift, border-lighten). |
| `glowing` | `boolean`| `present \| absent` | `absent` | Enables dynamic passive back-glow behind the card content. |

---

## Plain HTML / Vanilla ESM Usage

```html
<script type="module" src="./components/vanilla/index.ts"></script>

<!-- Ambient glassmorphism container -->
<bazodiac-card variant="glass" hoverable>
  <h3 class="font-serif text-lg text-gold-light">Seelen-Signatur</h3>
  <p class="text-xs text-stone-400 mt-2">Ihre tiefe kosmische Analysen.</p>
</bazodiac-card>
```

---

## React Usage (using React Wrapper)

The component is pre-wrapped inside a React forwardRef wrapper. It handles nested JSX children and standard pointer interactions.

```tsx
import { Card } from "./components/vanilla/ReactWrappers";

export default function App() {
  return (
    <Card variant="glass" hoverable glowing className="p-8">
      <h3 className="font-serif text-xl text-gold-light">BaZi Säulen-Zusammenfassung</h3>
      <p className="text-sm mt-4 text-[#E0D8D0]">Säule des Tagesmeisters geladen.</p>
    </Card>
  );
}
```

---

## Theme Adaptability

The card uses native CSS custom variables to automatically switch appearances:
- **`glass`**: Employs variable `--theme-glass-bg` which translates to translucent dark `rgba(10, 10, 15, 0.65)` in *Planetarium Noir* and soft sand-white translucent `rgba(250, 248, 244, 0.85)` in *Solar Aura*.
- **`solid`**: Resolves to `--bg-card` shifting between `#0d0d12` (dark) and `#EFECE7` (light).
- **Bezels**: Borders automatically shift from soft golden yellow-green highlights to refined golden brown outlines, achieving rich visibility of high contrast in both themes.
