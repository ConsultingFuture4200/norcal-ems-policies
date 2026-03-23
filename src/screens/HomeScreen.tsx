import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, Typography, Spacing } from '../theme';
import { SearchBar, ProviderFilter, SectionCard, PolicyCard } from '../components';
import { useSearch } from '../hooks/useSearch';
import { useFavorites } from '../hooks/useFavorites';
import { useProviderFilter } from '../hooks/useProviderFilter';
import { getSections, Policy, Section, SearchResult } from '../database';

export function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { activeLevel, toggleLevel } = useProviderFilter();
  const { query, setQuery, results, hasSearched } = useSearch(activeLevel);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const sections = useMemo(() => getSections(activeLevel), [activeLevel]);

  const handlePolicyPress = useCallback(
    (policy: Policy) => {
      navigation.navigate('PolicyDetail', { policyId: policy.id });
    },
    [navigation],
  );

  const handleSectionPress = useCallback(
    (section: Section) => {
      navigation.navigate('CategoryBrowser', {
        sectionId: section.id,
        sectionName: section.name,
      });
    },
    [navigation],
  );

  const isSearching = query.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[Typography.h1, { color: theme.text }]}>
          Nor-Cal EMS
        </Text>
        <Text style={[Typography.caption, { color: theme.textTertiary }]}>
          Field Guide — Offline & Searchable
        </Text>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchSection}>
        <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />
        <ProviderFilter activeLevel={activeLevel} onToggle={toggleLevel} />
      </View>

      {/* Content: Search results OR Home content */}
      {isSearching ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.policy.id}
          renderItem={({ item }: { item: SearchResult }) => (
            <PolicyCard
              policy={item.policy}
              searchResult={item}
              isFavorite={isFavorite(item.policy.id)}
              onPress={handlePolicyPress}
              onToggleFavorite={toggleFavorite}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyState}>
                <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center' }]}>
                  No policies found for "{query}"
                </Text>
                <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.sm }]}>
                  Try a different term or abbreviation
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Favorites section */}
          {favorites.length > 0 && (
            <View style={styles.favoritesSection}>
              <Text style={[Typography.h3, { color: theme.text, marginBottom: Spacing.md }]}>
                ★ Favorites
              </Text>
              {favorites.slice(0, 5).map(policy => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  isFavorite={true}
                  onPress={handlePolicyPress}
                  onToggleFavorite={toggleFavorite}
                  showSubsection={true}
                />
              ))}
              {favorites.length > 5 && (
                <Text
                  style={[Typography.caption, { color: theme.accent, textAlign: 'center', marginTop: Spacing.sm }]}
                  onPress={() => navigation.navigate('Favorites')}
                >
                  View all {favorites.length} favorites →
                </Text>
              )}
            </View>
          )}

          {/* Section cards */}
          <View style={styles.sectionsHeader}>
            <Text style={[Typography.h3, { color: theme.text }]}>
              Browse Policies
            </Text>
          </View>
          {sections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              onPress={handleSectionPress}
            />
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: 'center' }]}>
              Source: norcalems.org
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  favoritesSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionsHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyState: {
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xxl,
  },
  footer: {
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
});
