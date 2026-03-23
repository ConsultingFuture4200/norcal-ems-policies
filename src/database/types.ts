export interface Policy {
  id: string;
  title: string;
  section: string;
  subsection: string;
  providerLevels: string[];    // ['EMT', 'AEMT', 'Paramedic', 'CCP'] or ['All']
  keywords: string[];
  content: string;             // Full extracted text
  contentPreview: string;      // First ~200 chars
  extractionFailed: boolean;
  pageCount: number;
  pdfFilename: string;         // e.g., "1101.pdf"
}

export interface Section {
  id: string;
  name: string;
  sortOrder: number;
  policyCount?: number;
}

export interface Subsection {
  id: string;
  name: string;
  sectionId: string;
  sortOrder: number;
  policyCount?: number;
}

export interface SearchResult {
  policy: Policy;
  titleHighlight?: string;
  contentSnippet?: string;
  matchType: 'title' | 'keyword' | 'content';
}

export type ProviderLevel = 'EMT' | 'AEMT' | 'Paramedic' | 'CCP' | 'All';

export const PROVIDER_LEVELS: ProviderLevel[] = ['EMT', 'AEMT', 'Paramedic', 'CCP'];

export const SECTIONS: Section[] = [
  { id: '1000', name: 'Treatment Guidelines', sortOrder: 1 },
  { id: '2000', name: 'Certifications', sortOrder: 2 },
  { id: '3000', name: 'Prehospital Providers', sortOrder: 3 },
  { id: '4000', name: 'Hospitals', sortOrder: 4 },
  { id: '5000', name: 'Administration', sortOrder: 5 },
  { id: '6000', name: 'Training', sortOrder: 6 },
];
