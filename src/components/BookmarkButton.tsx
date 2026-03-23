import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, TouchTarget } from '../theme';

interface BookmarkButtonProps {
  isFavorite: boolean;
  onPress: () => void;
  size?: number;
}

export function BookmarkButton({ isFavorite, onPress, size = 28 }: BookmarkButtonProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.button}
      activeOpacity={0.6}
    >
      <Icon
        name={isFavorite ? 'star' : 'star-outline'}
        size={size}
        color={isFavorite ? theme.starActive : theme.starInactive}
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
