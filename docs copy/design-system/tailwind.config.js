/**
 * Quorvix Admin Design System - Tailwind CSS Configuration
 * 
 * This configuration extends Tailwind CSS with the Quorvix design tokens.
 * Copy this configuration to your tailwind.config.js file.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Black scale
                black: {
                    100: '#1C1C1C',
                    80: '#1C1C1CCC',
                    40: '#1C1C1C66',
                    20: '#1C1C1C33',
                    10: '#1C1C1C1A',
                    5: '#1C1C1C0D',
                },
                // White scale (using rgba for opacity)
                white: {
                    DEFAULT: '#FFFFFF',
                    100: '#FFFFFF',
                    80: 'rgba(255, 255, 255, 0.8)',
                    40: 'rgba(255, 255, 255, 0.4)',
                    20: 'rgba(255, 255, 255, 0.2)',
                    10: 'rgba(255, 255, 255, 0.1)',
                    5: 'rgba(255, 255, 255, 0.05)',
                },
                // Primary colors
                brand: {
                    primary: '#008B8B',
                    light: '#D8F0F1',
                },
                gray: {
                    light: '#E8E8E8',
                    medium: '#63626A',
                },
                // Secondary colors
                secondary: {
                    'light-blue': '#E5F1FF',
                    'slate-blue': '#34C759',
                    cream: '#FFF7E5',
                    tan: '#A4997D',
                    mint: '#E1F8F0',
                    sage: '#81A196',
                },
                // Semantic colors
                success: '#34C759',
                error: '#F94E72',
            },
            spacing: {
                xs: '4px',
                sm: '8px',
                md: '16px',
                lg: '24px',
                xl: '32px',
                xxl: '48px',
            },
            fontSize: {
                xs: ['12px', { lineHeight: '1.5' }],
                sm: ['14px', { lineHeight: '1.5' }],
                md: ['18px', { lineHeight: '1.5' }],
                lg: ['24px', { lineHeight: '1.3' }],
                xl: ['32px', { lineHeight: '1.2' }],
                xxl: ['48px', { lineHeight: '1.1' }],
            },
            fontFamily: {
                primary: ['Gilroy', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            fontWeight: {
                regular: '400',
                semibold: '600',
            },
            borderRadius: {
                base: '4px',
                standard: '8px',
                card: '12px',
                modal: '16px',
                container: '20px',
            },
            boxShadow: {
                sm: '0 1px 2px 0 rgba(28, 28, 28, 0.05)',
                md: '0 4px 6px -1px rgba(28, 28, 28, 0.1), 0 2px 4px -1px rgba(28, 28, 28, 0.06)',
                lg: '0 10px 15px -3px rgba(28, 28, 28, 0.1), 0 4px 6px -2px rgba(28, 28, 28, 0.05)',
                xl: '0 20px 25px -5px rgba(28, 28, 28, 0.1), 0 10px 10px -5px rgba(28, 28, 28, 0.04)',
            },
            transitionDuration: {
                fast: '150ms',
                base: '200ms',
                slow: '300ms',
            },
            zIndex: {
                dropdown: '1000',
                sticky: '1020',
                fixed: '1030',
                'modal-backdrop': '1040',
                modal: '1050',
                popover: '1060',
                tooltip: '1070',
            },
        },
    },
    plugins: [],
};
