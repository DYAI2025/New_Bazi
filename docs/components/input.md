# BazodiacInput Component (`<bazodiac-input>`)

The `<bazodiac-input>` is a powerful, unified input Web Component. It standardizes form labels, handles optional vector helper symbol rails, supports text/date/time/number structures, renders dynamic selection grids via JSON parameters, and fires standard custom change events.

---

## Technical Specifications

### Custom Element Tag
`bazodiac-input`

### Attributes & Properties

| Attribute | TypeScript Type | Allowed Values | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `string` | `"text" \| "number" \| "date" \| "time" \| "select"` | `"text"` | Data format of the field. |
| `label` | `string` | any human string | `""` | The title displayed in monospaced, high-contrast style. |
| `placeholder` | `string` | hint text | `""` | Placeholder text inside input. |
| `value` | `string \| number` | input value | `""` | Active input model value. |
| `icon` | `string` | `"user" \| "calendar" \| "clock" \| "map-pin" \| "globe"` | `""` | Matches internal inline SVGs. |
| `required` | `boolean` | `present \| absent` | `absent` | Declares forms validation requirement. |
| `options` | `string` (JSON) | Array of `{ value, label }` JSON string | `""` | Option configurations for `"select"` type. |
| `min`, `max`, `step` | `number \| string` | string values | `""` | Native step and bounds constraints. |

---

## Plain HTML / Vanilla ESM Usage

```html
<script type="module" src="./components/vanilla/index.ts"></script>

<!-- Text Input with user helper icon -->
<bazodiac-input 
  id="soul-name" 
  type="text" 
  label="Name der Seele" 
  placeholder="z.B. Alexis Vane" 
  icon="user"
  required
></bazodiac-input>

<!-- Select Input with JSON options string -->
<bazodiac-input 
  id="polarity" 
  type="select" 
  label="Tempel-Kanal Polarität" 
  value="Männlich"
  options='[{"value":"Weiblich","label":"Yin (Weiblich)"},{"value":"Männlich","label":"Yang (Männlich)"}]'
></bazodiac-input>

<script>
  const nameInput = document.getElementById('soul-name');
  nameInput.addEventListener('change', (e) => {
    console.log("Name updated to:", e.detail.value);
  });
</script>
```

---

## React Usage (using React Wrapper)

The React wrapper abstracts JSON serialization and handles standard react callbacks.

```tsx
import { Input } from "./components/vanilla/ReactWrappers";

export default function App() {
  const [formData, setFormData] = React.useState({
    name: "Benjamin",
    gender: "Männlich"
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Name"
        type="text"
        icon="user"
        value={formData.name}
        onChange={(val) => setFormData({ ...formData, name: val })}
      />
      
      <Input
        label="Polarität"
        type="select"
        value={formData.gender}
        options={[
          { value: "Weiblich", label: "Weiblich (Yin)" },
          { value: "Männlich", label: "Männlich (Yang)" }
        ]}
        onChange={(val) => setFormData({ ...formData, gender: val })}
      />
    </div>
  );
}
```

---

## Theme Adaptability

The input component renders fields with highly readable contrast styles conforming WCAG compliance:
- **Translucent Obsidian**: Inner input boxes have dark backgrounds `bg-obsidian-deep/65` which switch dynamically to warm neutral sand-white and deep dark charcoal text `#1D1B18` or sand cream text `#E0D8D0`.
- **Contrast Ratios**: Under light mode, deep text meets a ratio of >15:1. Under dark mode, warm cream text is perfectly visible, preventing visual strain.
