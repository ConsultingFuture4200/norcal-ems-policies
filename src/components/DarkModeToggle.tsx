import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, TouchTarget } from '../theme';

export function DarkModeToggle() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.button}
      activeOpacity={0.6}
    >
      <Icon
        name={isDark ? 'weather-sunny' : 'weather-night'}
        size={24}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: TouchTarget.icon,
    minHeight: TouchTarget.icon,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
