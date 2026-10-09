export const SEGMENTED_TABS_CLASS =
  'inline-flex rounded-full border border-glass/70 bg-glass/42 p-1 shadow-glass backdrop-blur-[18px]';

export const segmentedTabsSx = {
  minHeight: 44,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-list': { gap: '4px' },
};

export const segmentedTabSx = {
  minHeight: 40,
  px: 2.25,
  borderRadius: 'var(--button-radius)',
  textTransform: 'none',
  font: 'var(--body-2-m)',
  color: 'var(--text-light)',
  transition: 'background-color 200ms, color 200ms',
  '&:hover': { color: 'var(--ink)' },
  '&.Mui-selected': {
    color: 'var(--on-primary)',
    backgroundColor: 'var(--ink)',
  },
  '& .MuiSvgIcon-root': { fontSize: 18 },
};
