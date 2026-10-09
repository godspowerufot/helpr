# Quorvix Admin Design System - Tailwind CSS

Welcome to the Quorvix Admin Design System documentation for Tailwind CSS. This folder contains all the design guidelines, tokens, and component specifications for building consistent UI across the admin dashboard.

## 📁 Contents

- **[README.md](./README.md)** - Complete design system documentation with Tailwind CSS classes
- **[tailwind.config.js](./tailwind.config.js)** - Tailwind CSS configuration with all design tokens
- **[theme.css](./theme.css)** - Tailwind CSS v4 theme file with @theme directive
- **[components.md](./components.md)** - Component guidelines with Tailwind CSS examples
- **[tokens.ts](./tokens.ts)** - TypeScript/JavaScript design tokens (for programmatic use)

## 🚀 Quick Start

### For Tailwind CSS v3

1. **Copy the configuration** from [tailwind.config.js](./tailwind.config.js) to your project's `tailwind.config.js`

2. **Import Tailwind** in your CSS:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. **Use the custom classes**:
```tsx
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard">
  Click Me
</button>
```

### For Tailwind CSS v4

1. **Import the theme** in your `globals.css`:
```css
@import "./docs/design-system/theme.css";
```

2. **Use the custom classes**:
```tsx
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard">
  Click Me
</button>
```

## 🎨 Design Principles

1. **Consistency** - Use the 4x spacing system for predictable layouts
2. **Simplicity** - Keep the design clean and easy to understand
3. **Accessibility** - Maintain proper contrast ratios and touch targets
4. **Scalability** - Build reusable components with design tokens

## 📖 Key Features

### Color System
- **Brand Primary**: `bg-brand-primary` (#008B8B - Teal)
- **Semantic**: `text-success`, `text-error`
- **Neutral**: `text-black-100`, `bg-white-100` with opacity variants

### Typography
- **Font Family**: Gilroy - `font-primary`
- **Weights**: `font-regular` (400), `font-semibold` (600)
- **Sizes**: `text-xs` (12px) to `text-xxl` (48px)

### Spacing (4x System)
- `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `xxl` (48px)

### Border Radius
- `rounded-base` (4px), `rounded-standard` (8px), `rounded-card` (12px), `rounded-modal` (16px)

### Icons
- **Library**: Iconify
- **Primary Set**: Hugeicons (4,653+ icons)
- **Usage**: `<iconify-icon icon="hugeicons:notification-02" className="text-brand-primary"></iconify-icon>`

## 🛠️ Usage Examples

### Button
```tsx
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard text-sm font-semibold transition-base hover:bg-[#007070] hover:shadow-md">
  Primary Button
</button>
```

### Card
```tsx
<div className="bg-white-100 rounded-card shadow-sm p-lg hover:shadow-md transition-base">
  <h3 className="text-lg font-semibold text-black-100 mb-md">Card Title</h3>
  <p className="text-sm text-black-80">Card content</p>
</div>
```

### Input
```tsx
<input 
  className="px-md py-sm border border-black-20 rounded-standard text-sm focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-light"
  placeholder="Enter text"
/>
```

## 📝 Component Guidelines

See [components.md](./components.md) for detailed examples including:
- Buttons (Primary, Secondary, Sizes)
- Cards (Standard, With Icon)
- Input fields (Text, With Icon, Textarea)
- Badges (Status, With Dot)
- Modals (Complete structure)
- Tables (Basic table)
- Alerts (Success, Error, Info)

## 🎯 Quick Reference

**Common Patterns:**
```tsx
// Primary action
className="bg-brand-primary text-white-100 px-md py-sm rounded-standard font-semibold"

// Card container
className="bg-white-100 rounded-card shadow-sm p-lg"

// Text hierarchy
className="text-black-100"  // Primary text
className="text-black-80"   // Secondary text
className="text-black-40"   // Tertiary/disabled text

// Spacing
className="p-md"      // 16px padding
className="gap-lg"    // 24px gap
className="mb-xl"     // 32px margin bottom

// Interactive states
className="hover:bg-brand-light transition-base"
className="focus:outline-none focus:ring-4 focus:ring-brand-light"
```

## 📝 Contributing

When adding new components or patterns:
1. Follow the existing design tokens
2. Maintain the 4x spacing system
3. Ensure accessibility standards (contrast, focus states, touch targets)
4. Document your components with Tailwind examples

---

*Last updated: January 2026*
