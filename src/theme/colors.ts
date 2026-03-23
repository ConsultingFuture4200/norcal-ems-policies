export const ProviderColors = {
  EMT: '#2EA043',
  AEMT: '#D29922',
  Paramedic: '#388BFD',
  CCP: '#F85149',
  All: '#8B949E',
} as const;

export const DarkTheme = {
  background: '#0F1419',
  surface: '#1C2128',
  surfaceElevated: '#252C35',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  border: '#30363D',
  accent: '#58A6FF',
  accentDim: '#1A3A5C',
  searchHighlight: '#58A6FF',
  searchHighlightBg: 'rgba(88, 166, 255, 0.15)',
  danger: '#F85149',
  success: '#2EA043',
  warning: '#D29922',
  starActive: '#D29922',
  starInactive: '#30363D',
  statusBar: 'light-content' as const,
  isDark: true,
};

export const LightTheme = {
  background: '#FFFFFF',
  surface: '#F6F8FA',
  surfaceElevated: '#FFFFFF',
  text: '#1F2328',
  textSecondary: '#656D76',
  textTertiary: '#8B949E',
  border: '#D0D7DE',
  accent: '#0969DA',
  accentDim: '#DDF4FF',
  searchHighlight: '#0969DA',
  searchHighlightBg: 'rgba(9, 105, 218, 0.12)',
  danger: '#CF222E',
  success: '#1A7F37',
  warning: '#9A6700',
  starActive: '#9A6700',
  starInactive: '#D0D7DE',
  statusBar: 'dark-content' as const,
  isDark: false,
};

export type Theme = typeof DarkTheme;
