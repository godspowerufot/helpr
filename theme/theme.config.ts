import { createTheme, Shadows } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    radius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      full: string;
    };
    logo: {
      width: number;
      height: number;
    };
  }
  interface ThemeOptions {
    logo?: Partial<Theme>['logo'];
    radius?: Partial<Theme>['radius'];
  }
}

// Hex values must mirror the tokens in theme.css; MUI needs raw colours to derive hover/contrast shades.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111318',
      light: '#e6e8ef',
      dark: '#2b2e36',
      contrastText: '#ffffff',
    },
    secondary: { main: '#63656d', contrastText: '#ffffff' },
    success: { main: '#1f8a3f', light: '#e1f8f0' },
    error: { main: '#d4294f' },
    warning: { main: '#a4997d', light: '#fff7e5' },
    info: { main: '#63656d', light: '#e8ebf2' },
    text: {
      primary: '#111318',
      secondary: 'rgba(17, 19, 24, 0.7)',
      disabled: 'rgba(17, 19, 24, 0.4)',
    },
    background: { default: '#f7f8fa', paper: '#ffffff' },
    divider: 'rgba(17, 19, 24, 0.08)',
  },
  shape: { borderRadius: 12 },
  components: {
    // Labels stay raised so placeholders and native date/time text never sit under them.
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          color: 'var(--text)',
          fontWeight: 500,
          '&.Mui-focused': { color: 'var(--text)' },
          '&.Mui-error': { color: 'var(--error)' },
        },
      },
    },
    // Show the labelled '' option ("All categories") instead of a blank select.
    MuiSelect: {
      defaultProps: { displayEmpty: true },
    },
    MuiOutlinedInput: {
      defaultProps: { notched: true },
      styleOverrides: {
        root: {
          borderRadius: 'var(--input-radius)',
          backgroundColor: 'var(--surface)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--stroke)',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px var(--primary-light)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary)',
            borderWidth: 1,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 'var(--app-radius)' },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid var(--ink)',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: ['var(--font-app-font)'].join(','),
  },
  shadows: [
    'none',
    'var(--shadow-sm)',
    'var(--shadow-md)',
    'var(--shadow-lg)',
    ...Array(25 - 4).fill('var(--shadow-lg)'),
  ] as Shadows,
  spacing: (factor: number) => `calc(${factor} * var(--space-md))`,
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
  logo: {
    width: 73,
    height: 73,
  },
});
