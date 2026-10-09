export const buttonStyle = () => ({
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  borderRadius: 'var(--button-radius)',
  padding: '8px 20px',
  minHeight: '44px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'var(--primary-dark)',
    boxShadow: 'none',
  },
});

// Secondary form actions: outlined, so each screen keeps one filled button.
export const outlinedButtonStyle = () => ({
  borderRadius: 'var(--button-radius)',
  padding: '8px 20px',
  minHeight: '44px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  // Upload buttons are labels around a visually hidden input; show its focus.
  '&:focus-within': {
    outline: '2px solid var(--primary)',
    outlineOffset: '2px',
  },
});

export const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--input-radius)',
    backgroundColor: 'var(--surface)',
    fontSize: '14px',
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    boxShadow: '0 0 0 4px var(--primary-light)',
  },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': {
    borderColor: 'var(--primary)',
    borderWidth: '1px',
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'var(--disabled)',
    opacity: 1,
  },
};

// Leave `isCustomLabel` off: with it MSFLib renders the label as an <h1> that is not linked to
// the input. Off, the label goes to the MUI TextField (kept raised by the theme).
export const baseMData = {
  variant: 'outlined',
  sx: {
    ...inputStyle,
  },
};
