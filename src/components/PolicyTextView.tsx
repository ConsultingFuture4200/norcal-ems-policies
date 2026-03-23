import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme, Typography, Spacing } from '../theme';
import { Policy } from '../database/types';

interface PolicyTextViewProps {
  policy: Policy;
}

/**
 * Renders extracted policy text in a clean, readable format.
 * Handles paragraph breaks and basic structure.
 */
export function PolicyTextView({ policy }: PolicyTextViewProps) {
  const { theme } = useTheme();

  if (policy.extractionFailed || !policy.content) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
        <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center' }]}>
          Text content not available for this policy.
        </Text>
        <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.sm }]}>
          Switch to the PDF tab to view the original document.
        </Text>
      </View>
    );
  }

  // Split content into paragraphs, preserving structure
  const paragraphs = policy.content
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {paragraphs.map((paragraph, index) => {
        // Detect if paragraph looks like a header (short, possibly all caps or numbered)
        const isHeader = paragraph.length < 80 && (
          /^[A-Z][A-Z\s]+$/.test(paragraph) ||
          /^\d+[\.\)]\s/.test(paragraph) ||
          /^[A-Z][\w\s]+:$/.test(paragraph)
        );

        if (isHeader) {
          return (
            <Text
              key={index}
              style={[
                Typography.h3,
                {
                  color: theme.text,
                  marginTop: index > 0 ? Spacing.xl : 0,
                  marginBottom: Spacing.sm,
                },
              ]}
            >
              {paragraph}
            </Text>
          );
        }

        return (
          <Text
            key={index}
            style={[
              Typography.body,
              {
                color: theme.text,
                marginBottom: Spacing.md,
              },
            ]}
          >
            {paragraph}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.section,
    alignItems: 'center',
  },
});
