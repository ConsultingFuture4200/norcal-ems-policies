import AsyncStorage from "@react-native-async-storage/async-storage";
import policiesData from "@/data/policies.json";

export interface Policy {
  number: string;
  title: string;
  categoryId: string;
  categoryName: string;
  sectionId: string;
  sectionName: string;
}

export interface Section {
  id: string;
  name: string;
  policies: { number: string; title: string }[];
}

export interface Category {
  id: string;
  name: string;
  fullName: string;
  url: string;
  sections: Section[];
  policyCount: number;
}

const RECENT_KEY = "norcal_ems_recent_policies";
const MAX_RECENT = 10;

// Build flat list of all policies for search
let allPoliciesCache: Policy[] | null = null;

export function getCategories(): Category[] {
  return policiesData.categories.map((cat) => ({
    ...cat,
    policyCount: cat.sections.reduce((sum, sec) => sum + sec.policies.length, 0),
  }));
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((cat) => cat.id === id);
}

export function getAllPolicies(): Policy[] {
  if (allPoliciesCache) return allPoliciesCache;

  const policies: Policy[] = [];
  for (const cat of policiesData.categories) {
    for (const sec of cat.sections) {
      for (const pol of sec.policies) {
        policies.push({
          number: pol.number,
          title: pol.title,
          categoryId: cat.id,
          categoryName: cat.name,
          sectionId: sec.id,
          sectionName: sec.name,
        });
      }
    }
  }
  allPoliciesCache = policies;
  return policies;
}

export function searchPolicies(query: string): Policy[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase().trim();
  const terms = lowerQuery.split(/\s+/);

  return getAllPolicies().filter((policy) => {
    const searchText = `${policy.number} ${policy.title} ${policy.categoryName} ${policy.sectionName}`.toLowerCase();
    return terms.every((term) => searchText.includes(term));
  });
}

export async function getRecentPolicies(): Promise<Policy[]> {
  try {
    const stored = await AsyncStorage.getItem(RECENT_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Policy[];
  } catch {
    return [];
  }
}

export async function addRecentPolicy(policy: Policy): Promise<void> {
  try {
    const recent = await getRecentPolicies();
    const filtered = recent.filter((p) => p.number !== policy.number);
    const updated = [policy, ...filtered].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

export function getPolicyUrl(policyNumber: string): string {
  // NorCal EMS policies are hosted as PDFs on their website
  // The URL pattern is the category page URL where the PDF links are found
  const policy = getAllPolicies().find((p) => p.number === policyNumber);
  if (!policy) return "https://norcalems.org/policies/";

  const category = policiesData.categories.find((c) => c.id === policy.categoryId);
  return category?.url || "https://norcalems.org/policies/";
}
