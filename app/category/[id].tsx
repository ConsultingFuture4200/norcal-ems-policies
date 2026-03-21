import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getCategoryById,
  addRecentPolicy,
  type Section,
} from "@/lib/policy-store";

export default function CategoryDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const colors = useColors();
  const category = useMemo(() => getCategoryById(id), [id]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(category?.sections.map((s) => s.id) || [])
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
    },
    []
  );

  const handlePolicyPress = useCallback(
    async (policy: { number: string; title: string }) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (category) {
        const section = category.sections.find((s) =>
          s.policies.some((p) => p.number === policy.number)
        );
        await addRecentPolicy({
          number: policy.number,
          title: policy.title,
          categoryId: category.id,
          categoryName: category.name,
          sectionId: section?.id || "",
          sectionName: section?.name || "",
        });
      }
      // Open the category page where the PDF links are
      if (category?.url) {
        await WebBrowser.openBrowserAsync(category.url);
      }
    },
    [category]
  );

  const renderSection = useCallback(
    ({ item: section }: { item: Section }) => {
      const isExpanded = expandedSections.has(section.id);
      return (
        <View
          style={[
            styles.sectionContainer,
            { borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => toggleSection(section.id)}
            style={({ pressed }) => [
              styles.sectionHeader,
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text
                style={[
                  styles.sectionNumber,
                  { color: colors.primary },
                ]}
              >
                {section.id}
              </Text>
              <Text
                style={[
                  styles.sectionName,
                  { color: colors.foreground },
                ]}
                numberOfLines={2}
              >
                {section.name}
              </Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text
                style={[styles.sectionCount, { color: colors.muted }]}
              >
                {section.policies.length}
              </Text>
              <IconSymbol
                name={isExpanded ? "chevron.up" : "chevron.down"}
                size={18}
                color={colors.muted}
              />
            </View>
          </Pressable>
          {isExpanded && (
            <View style={styles.policiesList}>
              {section.policies.map((policy, index) => (
                <Pressable
                  key={policy.number}
                  onPress={() => handlePolicyPress(policy)}
                  style={({ pressed }) => [
                    styles.policyItem,
                    index < section.policies.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    pressed && { opacity: 0.7, backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.policyContent}>
                    <Text
                      style={[
                        styles.policyNumber,
                        { color: colors.primary },
                      ]}
                    >
                      {policy.number}
                    </Text>
                    <Text
                      style={[
                        styles.policyTitle,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={3}
                    >
                      {policy.title}
                    </Text>
                  </View>
                  <IconSymbol
                    name="link"
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      );
    },
    [expandedSections, colors, toggleSection, handlePolicyPress]
  );

  if (!category) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>Category not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol
              name="arrow.left"
              size={24}
              color={colors.primary}
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text
              style={[styles.headerNumber, { color: colors.primary }]}
            >
              {category.id}
            </Text>
            <Text
              style={[styles.headerTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </View>
        </View>

        {/* Section count */}
        <Text style={[styles.statsText, { color: colors.muted }]}>
          {category.sections.length} sections ·{" "}
          {category.sections.reduce(
            (sum, s) => sum + s.policies.length,
            0
          )}{" "}
          policies
        </Text>

        {/* Sections List */}
        <FlatList
          data={category.sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerNumber: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statsText: {
    fontSize: 13,
    marginBottom: 16,
    paddingLeft: 40,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  policiesList: {
    paddingHorizontal: 0,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  policyContent: {
    flex: 1,
  },
  policyNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 20,
  },
});
