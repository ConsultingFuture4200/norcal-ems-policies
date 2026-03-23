/**
 * Master pipeline: runs all 5 steps in sequence.
 * 
 * Usage: node pipeline.js
 * 
 * Steps:
 * 1. Scrape policy index from norcalems.org
 * 2. Download all PDFs
 * 3. Extract text from PDFs
 * 4. Generate metadata (provider levels, keywords)
 * 5. Build SQLite database + copy to Android assets
 */

import { scrapePolicies } from './scrape-policies.js';
import { downloadPdfs } from './download-pdfs.js';
import { extractText } from './extract-text.js';
import { generateMetadata } from './generate-metadata.js';
import { buildSqlite } from './build-sqlite.js';

async function runPipeline() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Nor-Cal EMS Field Guide — Build Pipeline   ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  try {
    // Step 1
    const scraped = await scrapePolicies();
    console.log(`Step 1 complete: ${scraped.totalPolicies} policies found\n`);

    // Step 2
    const downloads = await downloadPdfs();
    console.log(`Step 2 complete: ${downloads.totalDownloaded} PDFs downloaded\n`);

    // Step 3
    const extracted = await extractText();
    const extractedCount = Object.values(extracted).filter(e => !e.extractionFailed).length;
    console.log(`Step 3 complete: ${extractedCount} PDFs text extracted\n`);

    // Step 4
    await generateMetadata();
    console.log('Step 4 complete: metadata generated\n');

    // Step 5
    const db = await buildSqlite();
    console.log(`Step 5 complete: database built with ${db.policyCount} policies\n`);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║              Pipeline Complete!               ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`
  Total time: ${elapsed}s
  Policies:   ${db.policyCount}
  PDFs:       ${db.pdfsCopied}

  Next steps:
  1. cd .. (back to project root)
  2. npm install
  3. cd android && ./gradlew assembleRelease
  4. APK at: android/app/build/outputs/apk/release/app-release.apk
`);
  } catch (err) {
    console.error('\n✗ Pipeline failed:', err);
    process.exit(1);
  }
}

runPipeline();
