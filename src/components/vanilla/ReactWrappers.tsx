import React from "react";
import "./index"; // Ensures custom elements are registered

// Extend JSX namespace for custom web components
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "bazodiac-button": {
          class?: string;
          className?: string;
          id?: string;
          variant?: "primary" | "secondary" | "ghost" | "danger";
          glowing?: boolean | string;
          loading?: boolean | string;
          disabled?: boolean | string;
          type?: string;
          children?: any;
          onClick?: any;
          ref?: any;
        };
        "bazodiac-card": {
          class?: string;
          className?: string;
          id?: string;
          variant?: "glass" | "solid" | "thin";
          hoverable?: boolean | string;
          glowing?: boolean | string;
          children?: any;
          ref?: any;
        };
        "bazodiac-input": {
          class?: string;
          className?: string;
          id?: string;
          type?: string;
          label?: string;
          placeholder?: string;
          value?: string | number;
          options?: string;
          icon?: string;
          required?: boolean | string;
          min?: string | number;
          max?: string | number;
          step?: string | number;
          name?: string;
          ref?: any;
        };
      }
    }
  }
}

// React Wrapper for button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  glowing?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ children, variant = "primary", glowing, loading, disabled, className, ...props }, ref) => {
    return (
      <bazodiac-button
        ref={ref}
        variant={variant}
        glowing={glowing ? "" : undefined}
        loading={loading ? "" : undefined}
        disabled={disabled ? "" : undefined}
        class={className}
        onClick={props.onClick}
        id={props.id}
        {...(props as any)}
      >
        {children}
      </bazodiac-button>
    );
  }
);
Button.displayName = "Button";

// React Wrapper for card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "thin";
  hoverable?: boolean;
  glowing?: boolean;
}

export const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ children, variant = "glass", hoverable, glowing, className, ...props }, ref) => {
    return (
      <bazodiac-card
        ref={ref}
        variant={variant}
        hoverable={hoverable ? "" : undefined}
        glowing={glowing ? "" : undefined}
        class={className}
        {...(props as any)}
      >
        {children}
      </bazodiac-card>
    );
  }
);
Card.displayName = "Card";

// React Wrapper for input / select fields
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string | number;
  options?: Array<{ value: string; label: string }>;
  icon?: string;
  required?: boolean;
  onChange?: (val: string) => void;
}

export const Input = React.forwardRef<HTMLElement, InputProps>(
  ({ type = "text", label, placeholder, value, options, icon, required, className, onChange, ...props }, ref) => {
    const elementRef = React.useRef<HTMLElement | null>(null);

    // Sync ref
    React.useImperativeHandle(ref, () => elementRef.current as HTMLElement);

    // Set custom event listener for ESM Web component
    React.useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const handleCustomChange = (e: any) => {
        if (onChange) {
          onChange(e.detail.value);
        }
      };

      element.addEventListener("change", handleCustomChange);
      return () => {
        element.removeEventListener("change", handleCustomChange);
      };
    }, [onChange]);

    // Format options as a JSON string to pass as attribute
    const optionsAttrValue = options ? JSON.stringify(options) : undefined;

    return (
      <bazodiac-input
        ref={elementRef}
        type={type}
        label={label}
        placeholder={placeholder}
        value={value}
        options={optionsAttrValue}
        icon={icon}
        required={required ? "" : undefined}
        class={className}
        id={props.id}
        name={props.name}
        min={props.min}
        max={props.max}
        step={props.step}
      />
    );
  }
);
Input.displayName = "Input";
