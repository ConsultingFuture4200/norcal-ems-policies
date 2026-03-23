export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const TouchTarget = {
  min: 48,       // Minimum touch target height (dp)
  icon: 44,      // Interactive icon touch area
  comfortable: 56, // Comfortable touch target for gloved hands
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;
