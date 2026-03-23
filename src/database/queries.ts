import { getDatabase } from './db';
import { Policy, SearchResult, Section, Subsection, ProviderLevel } from './types';

// ---------- Helpers ----------

function parsePolicy(row: any): Policy {
  return {
    id: row.id,
    title: row.title,
    section: row.section,
    subsection: row.subsection,
    providerLevels: row.provider_levels ? row.provider_levels.split(',') : ['All'],
    keywords: row.keywords ? row.keywords.split(',') : [],
    content: row.content || '',
    contentPreview: row.content_preview || '',
    extractionFailed: row.extraction_failed === 1,
    pageCount: row.page_count || 0,
    pdfFilename: row.pdf_filename || `${row.id}.pdf`,
  };
}

function providerFilter(level: ProviderLevel | null): string {
  if (!level || level === 'All') return '';
  return ` AND (p.provider_levels LIKE '%${level}%' OR p.provider_levels = 'All')`;
}

// ---------- Search ----------

/**
 * Full-text search across titles, keywords, and content.
 * Returns results ranked by relevance with content snippets.
 */
export function searchPolicies(
  query: string,
  providerLevel: ProviderLevel | null = null,
  limit: number = 50,
): SearchResult[] {
  const db = getDatabase();

  if (!query || query.trim().length === 0) return [];

  // Sanitize query for FTS5: escape special chars, add prefix matching
  const sanitized = query
    .replace(/['"]/g, '')
    .replace(/[-+*()~^{}[\]]/g, ' ')
    .trim();

  if (!sanitized) return [];

  // Add prefix matching: "card" → "card*"
  const ftsQuery = sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map(term => `"${term}"*`)
    .join(' ');

  try {
    const sql = `
      SELECT 
        p.*,
        highlight(policies_fts, 0, '<<HL>>', '<</HL>>') as title_highlight,
        snippet(policies_fts, 2, '<<HL>>', '<</HL>>', '...', 40) as content_snippet,
        policies_fts.rank as fts_rank
      FROM policies_fts
      JOIN policies p ON policies_fts.rowid = p.rowid
      WHERE policies_fts MATCH ?
      ${providerFilter(level)}
      ORDER BY fts_rank
      LIMIT ?
    `.replace('level', 'providerLevel');

    // Build the actual query with provider filter
    let finalSql = `
      SELECT 
        p.*,
        highlight(policies_fts, 0, '<<HL>>', '<</HL>>') as title_highlight,
        snippet(policies_fts, 2, '<<HL>>', '<</HL>>', '...', 40) as content_snippet,
        policies_fts.rank as fts_rank
      FROM policies_fts
      JOIN policies p ON policies_fts.rowid = p.rowid
      WHERE policies_fts MATCH ?
    `;

    if (providerLevel && providerLevel !== 'All') {
      finalSql += ` AND (p.provider_levels LIKE '%${providerLevel}%' OR p.provider_levels = 'All')`;
    }

    finalSql += ` ORDER BY fts_rank LIMIT ?`;

    const result = db.execute(finalSql, [ftsQuery, limit]);
    const rows = result.rows?._array || [];

    return rows.map((row: any) => {
      const policy = parsePolicy(row);
      const titleHighlight = row.title_highlight || '';
      const contentSnippet = row.content_snippet || '';

      // Determine match type based on what highlighted
      let matchType: 'title' | 'keyword' | 'content' = 'content';
      if (titleHighlight.includes('<<HL>>')) {
        matchType = 'title';
      } else if (policy.keywords.some(k =>
        k.toLowerCase().includes(sanitized.toLowerCase())
      )) {
        matchType = 'keyword';
      }

      return {
        policy,
        titleHighlight,
        contentSnippet,
        matchType,
      };
    });
  } catch (err) {
    console.warn('Search error:', err);
    // Fallback: simple LIKE query
    return searchPoliciesFallback(sanitized, providerLevel, limit);
  }
}

/**
 * Fallback search using LIKE when FTS5 query fails (e.g., invalid syntax)
 */
function searchPoliciesFallback(
  query: string,
  providerLevel: ProviderLevel | null,
  limit: number,
): SearchResult[] {
  const db = getDatabase();
  const pattern = `%${query}%`;

  let sql = `
    SELECT p.* FROM policies p
    WHERE (p.title LIKE ? OR p.keywords LIKE ? OR p.content LIKE ? OR p.id LIKE ?)
  `;

  if (providerLevel && providerLevel !== 'All') {
    sql += ` AND (p.provider_levels LIKE '%${providerLevel}%' OR p.provider_levels = 'All')`;
  }

  sql += ` ORDER BY 
    CASE 
      WHEN p.id LIKE ? THEN 1
      WHEN p.title LIKE ? THEN 2
      WHEN p.keywords LIKE ? THEN 3
      ELSE 4 
    END
    LIMIT ?`;

  const result = db.execute(sql, [
    pattern, pattern, pattern, pattern,
    pattern, pattern, pattern,
    limit,
  ]);

  return (result.rows?._array || []).map((row: any) => ({
    policy: parsePolicy(row),
    matchType: 'title' as const,
    contentSnippet: row.content_preview || '',
  }));
}

// ---------- Listing ----------

/**
 * Get all sections with policy counts
 */
export function getSections(providerLevel: ProviderLevel | null = null): Section[] {
  const db = getDatabase();

  let sql = `
    SELECT 
      p.section as name,
      SUBSTR(p.section, 1, 4) as id,
      COUNT(*) as policy_count
    FROM policies p
    WHERE 1=1
  `;

  if (providerLevel && providerLevel !== 'All') {
    sql += ` AND (p.provider_levels LIKE '%${providerLevel}%' OR p.provider_levels = 'All')`;
  }

  sql += ` GROUP BY p.section ORDER BY id`;

  const result = db.execute(sql);
  return (result.rows?._array || []).map((row: any, i: number) => ({
    id: row.id,
    name: row.name,
    sortOrder: i + 1,
    policyCount: row.policy_count,
  }));
}

/**
 * Get subsections within a section, with policy counts
 */
export function getSubsections(
  sectionId: string,
  providerLevel: ProviderLevel | null = null,
): Subsection[] {
  const db = getDatabase();

  let sql = `
    SELECT 
      p.subsection as name,
      COUNT(*) as policy_count
    FROM policies p
    WHERE p.section LIKE ?
  `;

  if (providerLevel && providerLevel !== 'All') {
    sql += ` AND (p.provider_levels LIKE '%${providerLevel}%' OR p.provider_levels = 'All')`;
  }

  sql += ` GROUP BY p.subsection ORDER BY MIN(p.id)`;

  const result = db.execute(sql, [`${sectionId}%`]);
  return (result.rows?._array || []).map((row: any, i: number) => ({
    id: row.name,
    name: row.name,
    sectionId,
    sortOrder: i + 1,
    policyCount: row.policy_count,
  }));
}

/**
 * Get policies within a subsection
 */
export function getPoliciesBySubsection(
  subsection: string,
  providerLevel: ProviderLevel | null = null,
): Policy[] {
  const db = getDatabase();

  let sql = `SELECT * FROM policies p WHERE p.subsection = ?`;

  if (providerLevel && providerLevel !== 'All') {
    sql += ` AND (p.provider_levels LIKE '%${providerLevel}%' OR p.provider_levels = 'All')`;
  }

  sql += ` ORDER BY p.id`;

  const result = db.execute(sql, [subsection]);
  return (result.rows?._array || []).map(parsePolicy);
}

/**
 * Get a single policy by ID
 */
export function getPolicy(id: string): Policy | null {
  const db = getDatabase();
  const result = db.execute('SELECT * FROM policies WHERE id = ?', [id]);
  const row = result.rows?._array?.[0];
  return row ? parsePolicy(row) : null;
}

// ---------- Favorites ----------

/**
 * Toggle favorite status for a policy
 */
export function toggleFavorite(policyId: string): boolean {
  const db = getDatabase();
  const existing = db.execute(
    'SELECT 1 FROM favorites WHERE policy_id = ?',
    [policyId],
  );

  if (existing.rows?._array?.length) {
    db.execute('DELETE FROM favorites WHERE policy_id = ?', [policyId]);
    return false;
  } else {
    db.execute('INSERT INTO favorites (policy_id) VALUES (?)', [policyId]);
    return true;
  }
}

/**
 * Check if a policy is favorited
 */
export function isFavorite(policyId: string): boolean {
  const db = getDatabase();
  const result = db.execute(
    'SELECT 1 FROM favorites WHERE policy_id = ?',
    [policyId],
  );
  return (result.rows?._array?.length || 0) > 0;
}

/**
 * Get all favorited policies
 */
export function getFavorites(): Policy[] {
  const db = getDatabase();
  const result = db.execute(`
    SELECT p.* FROM policies p
    JOIN favorites f ON f.policy_id = p.id
    ORDER BY f.created_at DESC
  `);
  return (result.rows?._array || []).map(parsePolicy);
}

/**
 * Get count of all policies
 */
export function getPolicyCount(): number {
  const db = getDatabase();
  const result = db.execute('SELECT COUNT(*) as count FROM policies');
  return result.rows?._array?.[0]?.count || 0;
}

/**
 * Get the build/generation timestamp
 */
export function getBuildDate(): string | null {
  const db = getDatabase();
  try {
    const result = db.execute("SELECT value FROM metadata WHERE key = 'generated_at'");
    return result.rows?._array?.[0]?.value || null;
  } catch {
    return null;
  }
}
