import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../theme';
import { getProviderColor, getProviderLabel, displayProviderLevels } from '../utils/providerLevels';

interface ProviderBadgeProps {
  level: string;
  size?: 'small' | 'normal';
}

export function ProviderBadge({ level, size = 'normal' }: ProviderBadgeProps) {
  const color = getProviderColor(level);
  const label = getProviderLabel(level);
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '20', // 12% opacity
          borderColor: color + '40',     // 25% opacity
        },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          Typography.badge,
          { color },
          isSmall && styles.textSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

interface ProviderBadgesProps {
  levels: string[];
  size?: 'small' | 'normal';
}

export function ProviderBadges({ levels, size = 'normal' }: ProviderBadgesProps) {
  const displayLevels = displayProviderLevels(levels);

  return (
    <View style={styles.row}>
      {displayLevels.map(level => (
        <ProviderBadge key={level} level={level} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  badgeSmall: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  textSmall: {
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
