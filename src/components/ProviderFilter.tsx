import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Typography, Spacing, BorderRadius, TouchTarget } from '../theme';
import { ProviderLevel, PROVIDER_LEVELS } from '../database/types';
import { getProviderColor, getProviderLabel } from '../utils/providerLevels';

interface ProviderFilterProps {
  activeLevel: ProviderLevel | null;
  onToggle: (level: ProviderLevel) => void;
}

export function ProviderFilter({ activeLevel, onToggle }: ProviderFilterProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {PROVIDER_LEVELS.map(level => {
        const isActive = activeLevel === level;
        const color = getProviderColor(level);

        return (
          <TouchableOpacity
            key={level}
            onPress={() => onToggle(level)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? color + '25' : theme.surface,
                borderColor: isActive ? color : theme.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                Typography.label,
                {
                  color: isActive ? color : theme.textSecondary,
                  fontSize: 14,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {getProviderLabel(level)}
            </Text>
          </TouchableOpacity>
        );
      })}

      {activeLevel && (
        <TouchableOpacity
          onPress={() => onToggle(activeLevel)}
          style={[styles.clearPill, { borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[Typography.label, { color: theme.textTertiary, fontSize: 14 }]}>
            Clear
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  pill: {
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
  },
  clearPill: {
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
