/**
 * Step 3: Extract text from downloaded PDFs
 * 
 * Uses pdf-parse to extract text content. Flags PDFs where extraction
 * fails or yields minimal text (likely scanned/flowchart-only).
 * 
 * Input:  ./output/scraped-policies.json, ./output/pdfs/*.pdf
 * Output: ./output/extracted-text.json
 */

import pdfParse from 'pdf-parse';
import { readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const PDFS_DIR = join(OUTPUT_DIR, 'pdfs');

// If extracted text is shorter than this, flag as extraction failure
const MIN_TEXT_LENGTH = 50;

/**
 * Clean up extracted text:
 * - Normalize whitespace
 * - Remove common PDF artifacts
 * - Preserve paragraph structure
 */
function cleanText(raw) {
  if (!raw) return '';

  return raw
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove form feed characters
    .replace(/\f/g, '\n\n')
    // Remove null bytes
    .replace(/\0/g, '')
    // Collapse multiple spaces (but not newlines)
    .replace(/[^\S\n]+/g, ' ')
    // Collapse 3+ newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

async function extractFromPdf(policyId) {
  const pdfPath = join(PDFS_DIR, `${policyId}.pdf`);

  try {
    const fileStats = await stat(pdfPath);
    const buffer = await readFile(pdfPath);
    const data = await pdfParse(buffer, {
      // Limit pages to prevent hanging on huge documents
      max: 50,
    });

    const cleanedText = cleanText(data.text);
    const extractionFailed = cleanedText.length < MIN_TEXT_LENGTH;

    return {
      id: policyId,
      content: cleanedText,
      contentPreview: cleanedText.slice(0, 200),
      pageCount: data.numpages || 0,
      extractionFailed,
      fileSize: fileStats.size,
      error: null,
    };
  } catch (err) {
    return {
      id: policyId,
      content: '',
      contentPreview: '',
      pageCount: 0,
      extractionFailed: true,
      fileSize: 0,
      error: err.message,
    };
  }
}

export async function extractText() {
  console.log('=== Step 3: Extracting text from PDFs ===\n');

  const scraped = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'scraped-policies.json'), 'utf-8'),
  );

  const downloadReport = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'download-report.json'), 'utf-8'),
  );

  // Only process successfully downloaded PDFs
  const downloadedIds = new Set(downloadReport.successes.map(s => s.id));
  const toProcess = scraped.policies.filter(p => downloadedIds.has(p.id));

  console.log(`  Processing ${toProcess.length} PDFs...\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const policy = toProcess[i];
    const result = await extractFromPdf(policy.id);
    results.push(result);

    if (result.extractionFailed) {
      failCount++;
    } else {
      successCount++;
    }

    // Progress
    if ((i + 1) % 20 === 0 || i === toProcess.length - 1) {
      const pct = Math.round(((i + 1) / toProcess.length) * 100);
      process.stdout.write(`\r  Progress: ${i + 1}/${toProcess.length} (${pct}%)`);
    }
  }

  console.log('\n');
  console.log(`  ✓ Text extracted: ${successCount}`);
  console.log(`  ⚠ Extraction failed/minimal: ${failCount}`);

  if (failCount > 0) {
    console.log('\n  Failed/minimal extraction:');
    for (const r of results.filter(r => r.extractionFailed)) {
      const reason = r.error || `Only ${r.content.length} chars extracted`;
      console.log(`    - ${r.id}: ${reason}`);
    }
  }

  // Build a map for easy lookup
  const extractionMap = {};
  for (const r of results) {
    extractionMap[r.id] = r;
  }

  await writeFile(
    join(OUTPUT_DIR, 'extracted-text.json'),
    JSON.stringify(extractionMap, null, 2),
  );

  console.log(`\n  Output: ${join(OUTPUT_DIR, 'extracted-text.json')}\n`);

  return extractionMap;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  extractText().catch(err => {
    console.error('Extraction failed:', err);
    process.exit(1);
  });
}
