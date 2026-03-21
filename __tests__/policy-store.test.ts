import { describe, it, expect } from "vitest";

// We need to test the policy data and search logic
// Since the store uses AsyncStorage (not available in test), we test the pure functions

// Import the JSON data directly for testing
import policiesData from "../data/policies.json";

describe("Policy Data", () => {
  it("should have 6 categories", () => {
    expect(policiesData.categories).toHaveLength(6);
  });

  it("should have correct category IDs", () => {
    const ids = policiesData.categories.map((c) => c.id);
    expect(ids).toEqual(["1000", "2000", "3000", "4000", "5000", "6000"]);
  });

  it("should have correct category names", () => {
    const names = policiesData.categories.map((c) => c.name);
    expect(names).toEqual([
      "Treatment Guidelines",
      "Certifications",
      "Prehospital Providers",
      "Hospitals",
      "Administration",
      "Training",
    ]);
  });

  it("each category should have sections with policies", () => {
    for (const cat of policiesData.categories) {
      expect(cat.sections.length).toBeGreaterThan(0);
      for (const sec of cat.sections) {
        expect(sec.policies.length).toBeGreaterThan(0);
        for (const pol of sec.policies) {
          expect(pol.number).toBeTruthy();
          expect(pol.title).toBeTruthy();
        }
      }
    }
  });

  it("should have more than 200 total policies", () => {
    let total = 0;
    for (const cat of policiesData.categories) {
      for (const sec of cat.sections) {
        total += sec.policies.length;
      }
    }
    expect(total).toBeGreaterThan(200);
  });

  it("each category should have a valid URL", () => {
    for (const cat of policiesData.categories) {
      expect(cat.url).toMatch(/^https:\/\/norcalems\.org\/policies\//);
    }
  });
});

describe("Search Logic", () => {
  // Replicate the search logic from policy-store.ts for testing
  interface Policy {
    number: string;
    title: string;
    categoryId: string;
    categoryName: string;
    sectionId: string;
    sectionName: string;
  }

  function getAllPolicies(): Policy[] {
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
    return policies;
  }

  function searchPolicies(query: string): Policy[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    const terms = lowerQuery.split(/\s+/);
    return getAllPolicies().filter((policy) => {
      const searchText =
        `${policy.number} ${policy.title} ${policy.categoryName} ${policy.sectionName}`.toLowerCase();
      return terms.every((term) => searchText.includes(term));
    });
  }

  it("should return empty results for empty query", () => {
    expect(searchPolicies("")).toHaveLength(0);
    expect(searchPolicies("   ")).toHaveLength(0);
  });

  it("should find policies by number", () => {
    const results = searchPolicies("1101");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].number).toBe("1101");
    expect(results[0].title).toBe("Chest Pain");
  });

  it("should find policies by title keyword", () => {
    const results = searchPolicies("intubation");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(
        `${r.number} ${r.title}`.toLowerCase()
      ).toContain("intubation");
    });
  });

  it("should find policies with multi-word search", () => {
    const results = searchPolicies("chest pain");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.includes("Chest Pain"))).toBe(true);
  });

  it("should be case insensitive", () => {
    const results1 = searchPolicies("CARDIAC");
    const results2 = searchPolicies("cardiac");
    expect(results1).toEqual(results2);
  });

  it("should find policies across categories", () => {
    const results = searchPolicies("skills");
    const categories = new Set(results.map((r) => r.categoryId));
    expect(categories.size).toBeGreaterThan(1);
  });

  it("should search by category name", () => {
    const results = searchPolicies("training");
    expect(results.length).toBeGreaterThan(0);
  });
});
