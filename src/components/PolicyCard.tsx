import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing, BorderRadius, TouchTarget } from '../theme';
import { Policy, SearchResult } from '../database/types';
import { ProviderBadges } from './ProviderBadge';
import { renderHighlightedText } from '../utils/highlightText';

interface PolicyCardProps {
  policy: Policy;
  searchResult?: SearchResult;
  isFavorite?: boolean;
  onPress: (policy: Policy) => void;
  onToggleFavorite?: (policyId: string) => void;
  showSubsection?: boolean;
}

export function PolicyCard({
  policy,
  searchResult,
  isFavorite = false,
  onPress,
  onToggleFavorite,
  showSubsection = true,
}: PolicyCardProps) {
  const { theme } = useTheme();

  // Parse subsection display name
  const subsectionDisplay = policy.subsection.replace(/^\d+\s*/, '');

  // Determine what to show as the snippet
  const snippet = searchResult?.contentSnippet || policy.contentPreview;

  return (
    <TouchableOpacity
      onPress={() => onPress(policy)}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[Typography.policyNumber, { color: theme.accent }]}>
            {policy.id}
          </Text>
          <View style={styles.titleRow}>
            <Text
              style={[Typography.label, { color: theme.text, flex: 1 }]}
              numberOfLines={2}
            >
              {searchResult?.titleHighlight
                ? renderHighlightedText(
                    searchResult.titleHighlight,
                    { ...Typography.label, color: theme.text },
                    {
                      fontWeight: '700',
                      color: theme.searchHighlight,
                      backgroundColor: theme.searchHighlightBg,
                    },
                  )
                : policy.title}
            </Text>
          </View>
        </View>

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={() => onToggleFavorite(policy.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.starBtn}
          >
            <Icon
              name={isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite ? theme.starActive : theme.starInactive}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tags row */}
      <View style={styles.tagsRow}>
        {showSubsection && subsectionDisplay ? (
          <View style={[styles.subsectionTag, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>
              {subsectionDisplay}
            </Text>
          </View>
        ) : null}
        <ProviderBadges levels={policy.providerLevels} size="small" />
      </View>

      {/* Content snippet */}
      {snippet ? (
        <Text
          style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]}
          numberOfLines={3}
        >
          {searchResult?.contentSnippet
            ? renderHighlightedText(
                snippet,
                { ...Typography.caption, color: theme.textSecondary },
                {
                  fontWeight: '600',
                  color: theme.searchHighlight,
                  backgroundColor: theme.searchHighlightBg,
                },
              )
            : snippet}
        </Text>
      ) : null}

      {/* Extraction warning */}
      {policy.extractionFailed && (
        <View style={[styles.warning, { backgroundColor: theme.warning + '15' }]}>
          <Icon name="file-pdf-box" size={16} color={theme.warning} />
          <Text style={[Typography.caption, { color: theme.warning, marginLeft: 4 }]}>
            PDF only — text not available
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  starBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
    minWidth: TouchTarget.icon,
    minHeight: TouchTarget.icon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  subsectionTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
