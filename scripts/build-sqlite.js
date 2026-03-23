/**
 * Step 5: Build SQLite database with FTS5
 * 
 * Assembles scraped policies, extracted text, and metadata into a single
 * SQLite database with full-text search index. This database ships
 * inside the APK.
 * 
 * Input:  ./output/scraped-policies.json
 *         ./output/extracted-text.json
 *         ./output/metadata.json
 * Output: ./output/policies.db
 */

import Database from 'better-sqlite3';
import { readFile, copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const ANDROID_ASSETS = join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');

export async function buildSqlite() {
  console.log('=== Step 5: Building SQLite database ===\n');

  // Load all pipeline outputs
  const scraped = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'scraped-policies.json'), 'utf-8'),
  );
  const extractedText = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'extracted-text.json'), 'utf-8'),
  );
  const metadata = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'metadata.json'), 'utf-8'),
  );

  const dbPath = join(OUTPUT_DIR, 'policies.db');

  // Create fresh database
  const db = new Database(dbPath);

  // Enable WAL for better write performance during build
  db.pragma('journal_mode = WAL');

  // ---------- Create tables ----------

  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      section TEXT NOT NULL,
      subsection TEXT NOT NULL,
      provider_levels TEXT NOT NULL,
      keywords TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      content_preview TEXT NOT NULL DEFAULT '',
      extraction_failed INTEGER NOT NULL DEFAULT 0,
      page_count INTEGER NOT NULL DEFAULT 0,
      pdf_filename TEXT NOT NULL,
      pdf_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      policy_id TEXT PRIMARY KEY,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // ---------- FTS5 virtual table ----------

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS policies_fts USING fts5(
      title,
      keywords,
      content,
      content='policies',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );
  `);

  // ---------- Insert metadata ----------

  const insertMeta = db.prepare(
    'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
  );

  insertMeta.run('generated_at', new Date().toISOString());
  insertMeta.run('version', '1.0.0');
  insertMeta.run('policy_count', String(scraped.policies.length));
  insertMeta.run('source_url', 'https://norcalems.org/policies');

  // ---------- Insert policies ----------

  const insertPolicy = db.prepare(`
    INSERT OR REPLACE INTO policies 
    (id, title, section, subsection, provider_levels, keywords, content, content_preview, extraction_failed, page_count, pdf_filename, pdf_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO policies_fts (rowid, title, keywords, content)
    VALUES (?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    let rowid = 1;

    for (const policy of scraped.policies) {
      const text = extractedText[policy.id] || {};
      const meta = metadata[policy.id] || {};

      const providerLevels = (meta.providerLevels || ['All']).join(',');
      const keywords = (meta.keywords || []).join(',');
      const content = text.content || '';
      const contentPreview = text.contentPreview || content.slice(0, 200);
      const extractionFailed = text.extractionFailed ? 1 : 0;
      const pageCount = text.pageCount || 0;
      const pdfFilename = `${policy.id}.pdf`;

      insertPolicy.run(
        policy.id,
        policy.title,
        policy.section,
        policy.subsection,
        providerLevels,
        keywords,
        content,
        contentPreview,
        extractionFailed,
        pageCount,
        pdfFilename,
        policy.pdfUrl,
      );

      // Insert into FTS index
      insertFts.run(rowid, policy.title, keywords, content);
      rowid++;
    }
  });

  insertAll();

  // ---------- Create indexes ----------

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_policies_section ON policies(section);
    CREATE INDEX IF NOT EXISTS idx_policies_subsection ON policies(subsection);
  `);

  // ---------- Verify ----------

  const count = db.prepare('SELECT COUNT(*) as count FROM policies').get();
  const ftsCount = db.prepare('SELECT COUNT(*) as count FROM policies_fts').get();

  console.log(`  ✓ Policies inserted: ${count.count}`);
  console.log(`  ✓ FTS entries: ${ftsCount.count}`);

  // Test a search
  const testSearch = db.prepare(`
    SELECT p.id, p.title, snippet(policies_fts, 2, '<<HL>>', '<</HL>>', '...', 20) as snippet
    FROM policies_fts
    JOIN policies p ON policies_fts.rowid = p.rowid
    WHERE policies_fts MATCH '"chest pain"'
    LIMIT 5
  `).all();

  if (testSearch.length > 0) {
    console.log(`  ✓ Test search "chest pain": ${testSearch.length} results`);
    for (const r of testSearch) {
      console.log(`    - ${r.id}: ${r.title}`);
    }
  } else {
    console.log('  ⚠ Test search "chest pain" returned no results');
  }

  // Optimize
  db.exec("INSERT INTO policies_fts(policies_fts) VALUES('optimize')");

  // Switch back to DELETE journal mode for mobile (WAL needs extra files)
  db.pragma('journal_mode = DELETE');

  db.close();

  // ---------- Copy to Android assets ----------

  await mkdir(join(ANDROID_ASSETS), { recursive: true });
  await copyFile(dbPath, join(ANDROID_ASSETS, 'policies.db'));

  // Copy PDFs to Android assets
  const pdfsSrc = join(OUTPUT_DIR, 'pdfs');
  const pdfsDest = join(ANDROID_ASSETS, 'pdfs');
  await mkdir(pdfsDest, { recursive: true });

  // Copy each PDF
  let pdfsCopied = 0;
  for (const policy of scraped.policies) {
    const srcFile = join(pdfsSrc, `${policy.id}.pdf`);
    const destFile = join(pdfsDest, `${policy.id}.pdf`);
    try {
      await copyFile(srcFile, destFile);
      pdfsCopied++;
    } catch {
      // PDF may not have downloaded successfully — skip
    }
  }

  console.log(`\n  ✓ Database: ${dbPath}`);
  console.log(`  ✓ Copied to Android assets: ${join(ANDROID_ASSETS, 'policies.db')}`);
  console.log(`  ✓ PDFs copied to assets: ${pdfsCopied}`);
  console.log('');

  return { dbPath, policyCount: count.count, pdfsCopied };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSqlite().catch(err => {
    console.error('SQLite build failed:', err);
    process.exit(1);
  });
}
