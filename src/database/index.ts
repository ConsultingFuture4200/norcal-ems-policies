export { initDatabase, getDatabase, closeDatabase } from './db';
export {
  searchPolicies,
  getSections,
  getSubsections,
  getPoliciesBySubsection,
  getPolicy,
  toggleFavorite,
  isFavorite,
  getFavorites,
  getPolicyCount,
  getBuildDate,
} from './queries';
export type { Policy, SearchResult, Section, Subsection, ProviderLevel } from './types';
export { PROVIDER_LEVELS, SECTIONS } from './types';
