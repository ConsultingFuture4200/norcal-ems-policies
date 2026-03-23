import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing, BorderRadius, TouchTarget } from '../theme';
import { Subsection, Policy } from '../database/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SubsectionAccordionProps {
  subsection: Subsection;
  policies: Policy[];
  onPolicyPress: (policy: Policy) => void;
  defaultExpanded?: boolean;
}

export function SubsectionAccordion({
  subsection,
  policies,
  onPolicyPress,
  defaultExpanded = false,
}: SubsectionAccordionProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  const displayName = subsection.name.replace(/^\d+\s*/, '');

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={[styles.header, { backgroundColor: theme.surface }]}
      >
        <View style={styles.headerContent}>
          <Text style={[Typography.h3, { color: theme.text, flex: 1 }]}>
            {displayName}
          </Text>
          <Text style={[Typography.caption, { color: theme.textTertiary, marginRight: Spacing.sm }]}>
            {subsection.policyCount || policies.length}
          </Text>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {policies.map(policy => (
            <TouchableOpacity
              key={policy.id}
              onPress={() => onPolicyPress(policy)}
              activeOpacity={0.7}
              style={[
                styles.policyRow,
                {
                  backgroundColor: theme.background,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <Text style={[Typography.policyNumber, { color: theme.accent, marginRight: Spacing.md }]}>
                {policy.id}
              </Text>
              <Text
                style={[Typography.bodySmall, { color: theme.text, flex: 1 }]}
                numberOfLines={2}
              >
                {policy.title}
              </Text>
              <Icon name="chevron-right" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    minHeight: TouchTarget.comfortable,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    // No extra padding — rows handle their own
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
