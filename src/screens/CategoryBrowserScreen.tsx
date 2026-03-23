import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme, Typography, Spacing } from '../theme';
import { ProviderFilter, SubsectionAccordion } from '../components';
import { useProviderFilter } from '../hooks/useProviderFilter';
import { getSubsections, getPoliciesBySubsection, Policy } from '../database';

type RouteParams = {
  CategoryBrowser: {
    sectionId: string;
    sectionName: string;
  };
};

export function CategoryBrowserScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CategoryBrowser'>>();
  const { sectionId, sectionName } = route.params;
  const { activeLevel, toggleLevel } = useProviderFilter();

  const subsections = useMemo(
    () => getSubsections(sectionId, activeLevel),
    [sectionId, activeLevel],
  );

  // Pre-load policies for each subsection
  const policiesBySubsection = useMemo(() => {
    const map: Record<string, Policy[]> = {};
    for (const sub of subsections) {
      map[sub.name] = getPoliciesBySubsection(sub.name, activeLevel);
    }
    return map;
  }, [subsections, activeLevel]);

  const handlePolicyPress = useCallback(
    (policy: Policy) => {
      navigation.navigate('PolicyDetail', { policyId: policy.id });
    },
    [navigation],
  );

  const displayName = sectionName.replace(/^\d+\s*/, '');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      <View style={styles.filterSection}>
        <ProviderFilter activeLevel={activeLevel} onToggle={toggleLevel} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subsections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center' }]}>
              No policies found{activeLevel ? ` for ${activeLevel} level` : ''}
            </Text>
          </View>
        ) : (
          subsections.map(sub => (
            <SubsectionAccordion
              key={sub.id}
              subsection={sub}
              policies={policiesBySubsection[sub.name] || []}
              onPolicyPress={handlePolicyPress}
              defaultExpanded={subsections.length === 1}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  emptyState: {
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xxl,
  },
});
