import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getCategories,
  searchPolicies,
  getRecentPolicies,
  addRecentPolicy,
  getPolicyUrl,
  type Policy,
  type Category,
} from "@/lib/policy-store";
import * as WebBrowser from "expo-web-browser";

const CATEGORY_ICONS: Record<string, string> = {
  "1000": "🏥",
  "2000": "📋",
  "3000": "🚑",
  "4000": "🏨",
  "5000": "⚖️",
  "6000": "📚",
};

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const categories = useMemo(() => getCategories(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Policy[]>([]);
  const [recentPolicies, setRecentPolicies] = useState<Policy[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    const recent = await getRecentPolicies();
    setRecentPolicies(recent);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      setIsSearching(true);
      const results = searchPolicies(text);
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, []);

  const handleCategoryPress = useCallback(
    (category: Category) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push(`/category/${category.id}?name=${encodeURIComponent(category.name)}` as any);
    },
    [router]
  );

  const handlePolicyPress = useCallback(
    async (policy: Policy) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await addRecentPolicy(policy);
      loadRecent();
      const url = getPolicyUrl(policy.number);
      await WebBrowser.openBrowserAsync(url);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  }, []);

  const renderCategoryCard = useCallback(
    ({ item }: { item: Category }) => (
      <Pressable
        onPress={() => handleCategoryPress(item)}
        style={({ pressed }) => [
          styles.categoryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.categoryCardLeft}>
          <Text style={styles.categoryEmoji}>
            {CATEGORY_ICONS[item.id] || "📄"}
          </Text>
          <View style={styles.categoryCardText}>
            <Text
              style={[styles.categoryNumber, { color: colors.primary }]}
            >
              {item.id}
            </Text>
            <Text
              style={[styles.categoryName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.policyCount, { color: colors.muted }]}>
              {item.policyCount} policies
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      </Pressable>
    ),
    [colors, handleCategoryPress]
  );

  const renderSearchResult = useCallback(
    ({ item }: { item: Policy }) => (
      <Pressable
        onPress={() => handlePolicyPress(item)}
        style={({ pressed }) => [
          styles.searchResultItem,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.searchResultContent}>
          <Text
            style={[styles.searchResultNumber, { color: colors.primary }]}
          >
            {item.number}
          </Text>
          <Text
            style={[styles.searchResultTitle, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={[styles.searchResultMeta, { color: colors.muted }]}>
            {item.categoryName} › {item.sectionName}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </Pressable>
    ),
    [colors, handlePolicyPress]
  );

  const renderRecentItem = useCallback(
    ({ item }: { item: Policy }) => (
      <Pressable
        onPress={() => handlePolicyPress(item)}
        style={({ pressed }) => [
          styles.recentItem,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <IconSymbol name="clock.fill" size={14} color={colors.muted} />
        <View style={styles.recentItemText}>
          <Text
            style={[styles.recentNumber, { color: colors.primary }]}
            numberOfLines={1}
          >
            {item.number}
          </Text>
          <Text
            style={[styles.recentTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
      </Pressable>
    ),
    [colors, handlePolicyPress]
  );

  const totalPolicies = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.policyCount, 0),
    [categories]
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.appTitle, { color: colors.foreground }]}>
            NorCal EMS
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.muted }]}>
            Policies
          </Text>
        </View>
        <Text style={[styles.statsText, { color: colors.muted }]}>
          {totalPolicies} policies across {categories.length} categories
        </Text>
      </View>
    ),
    [colors, totalPolicies, categories.length]
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        {!isSearching && ListHeader}

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: isSearching ? colors.primary : colors.border,
            },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.muted}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search policies by number or title..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={clearSearch}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <IconSymbol name="xmark" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Search Results */}
        {isSearching ? (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.number}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IconSymbol
                    name="magnifyingglass"
                    size={48}
                    color={colors.border}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.muted }]}
                  >
                    No policies found matching your search.
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              recentPolicies.length > 0 ? (
                <View style={styles.recentSection}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.muted }]}
                  >
                    RECENTLY VIEWED
                  </Text>
                  <FlatList
                    data={recentPolicies}
                    renderItem={renderRecentItem}
                    keyExtractor={(item) => `recent-${item.number}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentList}
                  />
                </View>
              ) : null
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.muted }]}>
                  Source: norcalems.org/policies
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  statsText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    paddingBottom: 100,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  categoryCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryCardText: {
    flex: 1,
  },
  categoryNumber: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 2,
  },
  policyCount: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    width: 200,
  },
  recentItemText: {
    flex: 1,
  },
  recentNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  recentTitle: {
    fontSize: 13,
    marginTop: 1,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  searchResultMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
  },
});
