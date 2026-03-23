import { TextStyle } from 'react-native';

export const Typography = {
  // Headers
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  } as TextStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,

  // Body
  body: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 29,  // ~1.6 line height
  } as TextStyle,
  bodySmall: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,

  // UI
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  } as TextStyle,
  badge: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  // Search
  searchInput: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 26,
  } as TextStyle,
  policyNumber: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
};
