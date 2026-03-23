import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, Typography, Spacing } from '../theme';
import { ProviderFilter, SectionCard } from '../components';
import { useProviderFilter } from '../hooks/useProviderFilter';
import { getSections, Section } from '../database';

export function BrowseScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { activeLevel, toggleLevel } = useProviderFilter();

  const sections = useMemo(() => getSections(activeLevel), [activeLevel]);

  const handleSectionPress = useCallback(
    (section: Section) => {
      navigation.navigate('CategoryBrowser', {
        sectionId: section.id,
        sectionName: section.name,
      });
    },
    [navigation],
  );

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
        {sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            onPress={handleSectionPress}
          />
        ))}
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
});
