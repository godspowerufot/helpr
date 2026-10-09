# UI Components Documentation

## Button Component

A reusable button component with multiple variants, sizes, and states.

### Props

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}
```

### Usage

```tsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" size="md">
  Click Me
</Button>

// Loading state
<Button variant="primary" isLoading>
  Loading...
</Button>

// Full width
<Button variant="primary" fullWidth>
  Submit
</Button>

// Outline variant
<Button variant="outline" size="lg">
  Cancel
</Button>
```

### Variants

- **primary**: Teal background with white text
- **secondary**: Light gray background
- **outline**: Transparent with teal border
- **ghost**: Transparent with hover effect

### Sizes

- **sm**: Small (px-sm py-xs text-xs)
- **md**: Medium (px-md py-sm text-sm) - Default
- **lg**: Large (px-lg py-md text-md)

---

## Input Component

A reusable input component with label, error states, and password toggle.

### Props

```tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}
```

### Usage

```tsx
import { Input } from '@/components/ui';

// Basic input
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password is required"
/>

// Password with toggle
<Input
  label="Password"
  type="password"
  showPasswordToggle
/>

// With helper text
<Input
  label="Username"
  helperText="Must be at least 3 characters"
/>
```

### Features

- **Label**: Optional label with required indicator
- **Error State**: Red border and error message
- **Helper Text**: Gray helper text below input
- **Password Toggle**: Eye icon to show/hide password
- **Full Width**: Spans full width by default
- **Focus States**: Brand primary focus ring

---

## Styling with clsx

Both components use `clsx` for dynamic className composition:

```tsx
// Button example
className={clsx(
  baseStyles,
  variantStyles[variant],
  sizeStyles[size],
  widthStyles,
  className // Custom classes from props
)}

// Input example
className={clsx(
  baseInputStyles,
  stateStyles,
  widthStyles,
  showPasswordToggle && 'pr-10',
  className
)}
```

This allows for:
- Conditional styling based on props
- Easy variant/size switching
- Custom className overrides
- Clean, maintainable code
