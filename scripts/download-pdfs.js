/**
 * Step 2: Download all PDFs from norcalems.org
 * 
 * Reads scraped-policies.json, downloads each PDF, renames to {id}.pdf
 * 
 * Input:  ./output/scraped-policies.json
 * Output: ./output/pdfs/{id}.pdf
 */

import fetch from 'node-fetch';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const PDFS_DIR = join(OUTPUT_DIR, 'pdfs');

const CONCURRENCY = 5;       // Parallel downloads
const RETRY_DELAY_MS = 2000;
const REQUEST_DELAY_MS = 200; // Be polite to the server

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadPdf(policy, retries = 1) {
  const outputPath = join(PDFS_DIR, `${policy.id}.pdf`);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(policy.pdfUrl, {
        headers: {
          'User-Agent': 'NorCalEMSGuide-Builder/1.0',
        },
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      await writeFile(outputPath, Buffer.from(buffer));

      return {
        id: policy.id,
        success: true,
        filename: `${policy.id}.pdf`,
        size: buffer.byteLength,
      };
    } catch (err) {
      if (attempt < retries) {
        console.log(`    Retry ${policy.id}: ${err.message}`);
        await sleep(RETRY_DELAY_MS);
      } else {
        return {
          id: policy.id,
          success: false,
          error: err.message,
        };
      }
    }
  }
}

async function downloadBatch(policies, onProgress) {
  const results = [];
  let completed = 0;

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < policies.length; i += CONCURRENCY) {
    const batch = policies.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(p => downloadPdf(p)));

    results.push(...batchResults);
    completed += batchResults.length;

    if (onProgress) onProgress(completed, policies.length);

    // Rate limiting: short pause between batches
    if (i + CONCURRENCY < policies.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return results;
}

export async function downloadPdfs() {
  console.log('=== Step 2: Downloading PDFs ===\n');

  await mkdir(PDFS_DIR, { recursive: true });

  // Read scraped data
  const scraped = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'scraped-policies.json'), 'utf-8'),
  );

  console.log(`  Downloading ${scraped.policies.length} PDFs...\n`);

  const results = await downloadBatch(scraped.policies, (done, total) => {
    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\r  Progress: ${done}/${total} (${pct}%)`);
  });

  console.log('\n');

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  const totalSize = successes.reduce((sum, r) => sum + (r.size || 0), 0);

  console.log(`  ✓ Downloaded: ${successes.length}`);
  console.log(`  ✗ Failed: ${failures.length}`);
  console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

  if (failures.length > 0) {
    console.log('\n  Failed downloads:');
    for (const f of failures) {
      console.log(`    - ${f.id}: ${f.error}`);
    }
  }

  // Save download report
  const report = {
    downloadedAt: new Date().toISOString(),
    totalDownloaded: successes.length,
    totalFailed: failures.length,
    totalSizeBytes: totalSize,
    failures: failures,
    successes: successes.map(s => ({ id: s.id, filename: s.filename, size: s.size })),
  };

  await writeFile(
    join(OUTPUT_DIR, 'download-report.json'),
    JSON.stringify(report, null, 2),
  );

  console.log(`\n  Report: ${join(OUTPUT_DIR, 'download-report.json')}\n`);

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadPdfs().catch(err => {
    console.error('Download failed:', err);
    process.exit(1);
  });
}
