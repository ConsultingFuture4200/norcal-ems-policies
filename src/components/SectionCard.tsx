import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing, BorderRadius, TouchTarget } from '../theme';
import { Section } from '../database/types';

// Map section IDs to appropriate icons
const SECTION_ICONS: Record<string, string> = {
  '1000': 'medical-bag',
  '2000': 'certificate',
  '3000': 'ambulance',
  '4000': 'hospital-building',
  '5000': 'file-document-outline',
  '6000': 'school',
};

const SECTION_ACCENT: Record<string, string> = {
  '1000': '#F85149',   // Red — treatment is clinical/urgent
  '2000': '#D29922',   // Amber — certifications
  '3000': '#388BFD',   // Blue — providers
  '4000': '#2EA043',   // Green — hospitals
  '5000': '#8B949E',   // Gray — admin
  '6000': '#A371F7',   // Purple — training
};

interface SectionCardProps {
  section: Section;
  onPress: (section: Section) => void;
}

export function SectionCard({ section, onPress }: SectionCardProps) {
  const { theme } = useTheme();
  const icon = SECTION_ICONS[section.id] || 'file-document-outline';
  const accent = SECTION_ACCENT[section.id] || theme.accent;

  // Parse name: remove the leading number (e.g., "1000 Treatment Guidelines" → "Treatment Guidelines")
  const displayName = section.name.replace(/^\d+\s*/, '');

  return (
    <TouchableOpacity
      onPress={() => onPress(section)}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: accent + '18' }]}>
        <Icon name={icon} size={28} color={accent} />
      </View>
      <View style={styles.content}>
        <Text style={[Typography.policyNumber, { color: theme.textTertiary }]}>
          {section.id}
        </Text>
        <Text style={[Typography.label, { color: theme.text }]} numberOfLines={2}>
          {displayName}
        </Text>
      </View>
      {section.policyCount != null && (
        <Text style={[Typography.caption, { color: theme.textTertiary }]}>
          {section.policyCount}
        </Text>
      )}
      <Icon name="chevron-right" size={24} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.comfortable + 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});
