import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing } from '../theme';
import { PolicyCard } from '../components';
import { useFavorites } from '../hooks/useFavorites';
import { Policy } from '../database';

export function FavoritesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const handlePolicyPress = useCallback(
    (policy: Policy) => {
      navigation.navigate('PolicyDetail', { policyId: policy.id });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PolicyCard
            policy={item}
            isFavorite={true}
            onPress={handlePolicyPress}
            onToggleFavorite={toggleFavorite}
            showSubsection={true}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="star-outline" size={64} color={theme.textTertiary} />
            <Text
              style={[
                Typography.h3,
                { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.lg },
              ]}
            >
              No favorites yet
            </Text>
            <Text
              style={[
                Typography.caption,
                { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
              ]}
            >
              Star policies for quick access — they'll show up here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.section,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});
