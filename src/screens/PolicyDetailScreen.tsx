import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing, BorderRadius, TouchTarget } from '../theme';
import { PolicyTextView, PdfViewer, ProviderBadges, BookmarkButton } from '../components';
import { useFavorites } from '../hooks/useFavorites';
import { getPolicy } from '../database';

type RouteParams = {
  PolicyDetail: {
    policyId: string;
  };
};

type Tab = 'text' | 'pdf';

export function PolicyDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RouteParams, 'PolicyDetail'>>();
  const { policyId } = route.params;
  const { toggleFavorite, isFavorite } = useFavorites();

  const policy = useMemo(() => getPolicy(policyId), [policyId]);

  // Default to PDF if text extraction failed
  const [activeTab, setActiveTab] = useState<Tab>(
    policy?.extractionFailed ? 'pdf' : 'text',
  );

  const handleToggleFavorite = useCallback(() => {
    if (policy) toggleFavorite(policy.id);
  }, [policy, toggleFavorite]);

  if (!policy) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[Typography.body, { color: theme.textSecondary }]}>
          Policy not found
        </Text>
      </View>
    );
  }

  const subsectionDisplay = policy.subsection.replace(/^\d+\s*/, '');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      {/* Policy header */}
      <View style={[styles.policyHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={[Typography.policyNumber, { color: theme.accent, fontSize: 18 }]}>
              {policy.id}
            </Text>
            <Text style={[Typography.h2, { color: theme.text, marginTop: 2 }]}>
              {policy.title}
            </Text>
          </View>
          <BookmarkButton
            isFavorite={isFavorite(policy.id)}
            onPress={handleToggleFavorite}
          />
        </View>

        {/* Breadcrumb + badges */}
        <View style={styles.metaRow}>
          <Text style={[Typography.caption, { color: theme.textTertiary }]}>
            {policy.section} › {subsectionDisplay}
          </Text>
        </View>
        <View style={{ marginTop: Spacing.sm }}>
          <ProviderBadges levels={policy.providerLevels} />
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabBar, { borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('text')}
            style={[
              styles.tab,
              activeTab === 'text' && {
                borderBottomColor: theme.accent,
                borderBottomWidth: 2,
              },
            ]}
            disabled={policy.extractionFailed}
            activeOpacity={0.7}
          >
            <Icon
              name="text-box-outline"
              size={20}
              color={
                policy.extractionFailed
                  ? theme.textTertiary
                  : activeTab === 'text'
                  ? theme.accent
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                Typography.label,
                {
                  color:
                    policy.extractionFailed
                      ? theme.textTertiary
                      : activeTab === 'text'
                      ? theme.accent
                      : theme.textSecondary,
                  marginLeft: Spacing.xs,
                  fontSize: 14,
                },
              ]}
            >
              Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('pdf')}
            style={[
              styles.tab,
              activeTab === 'pdf' && {
                borderBottomColor: theme.accent,
                borderBottomWidth: 2,
              },
            ]}
            activeOpacity={0.7}
          >
            <Icon
              name="file-pdf-box"
              size={20}
              color={activeTab === 'pdf' ? theme.accent : theme.textSecondary}
            />
            <Text
              style={[
                Typography.label,
                {
                  color: activeTab === 'pdf' ? theme.accent : theme.textSecondary,
                  marginLeft: Spacing.xs,
                  fontSize: 14,
                },
              ]}
            >
              PDF
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab content */}
      {activeTab === 'text' ? (
        <ScrollView
          contentContainerStyle={styles.textContent}
          showsVerticalScrollIndicator={true}
        >
          <PolicyTextView policy={policy} />
        </ScrollView>
      ) : (
        <PdfViewer pdfFilename={policy.pdfFilename} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  metaRow: {
    marginTop: Spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  textContent: {
    paddingBottom: Spacing.section,
  },
});
