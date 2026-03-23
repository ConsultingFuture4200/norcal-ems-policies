/**
 * Step 1: Scrape policy index pages from norcalems.org
 * 
 * Fetches 6 section pages and extracts every PDF link with metadata:
 * id, title, pdfUrl, section, subsection
 * 
 * Output: ./output/scraped-policies.json
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');

const SECTION_PAGES = [
  {
    url: 'https://norcalems.org/1000-treatment-guidelines/',
    sectionId: '1000',
    sectionName: '1000 Treatment Guidelines',
  },
  {
    url: 'https://norcalems.org/2000-certifications/',
    sectionId: '2000',
    sectionName: '2000 Certifications',
  },
  {
    url: 'https://norcalems.org/3000-prehospital-providers/',
    sectionId: '3000',
    sectionName: '3000 Prehospital Providers',
  },
  {
    url: 'https://norcalems.org/4000-hospitals/',
    sectionId: '4000',
    sectionName: '4000 Hospitals',
  },
  {
    url: 'https://norcalems.org/5000-administration/',
    sectionId: '5000',
    sectionName: '5000 Administration',
  },
  {
    url: 'https://norcalems.org/6000-training/',
    sectionId: '6000',
    sectionName: '6000 Training',
  },
];

/**
 * Extract policy number from link text or URL.
 * Handles patterns like "1101 High Performance CPR", "1200A Refusal of Care Form",
 * "19280 AEMT Seizure", etc.
 */
function extractPolicyId(linkText, pdfUrl) {
  // Try from link text first
  const textMatch = linkText.match(/^(\d{4,5}[A-Za-z]?)\s/);
  if (textMatch) return textMatch[1];

  // Try from filename in URL
  const urlMatch = pdfUrl.match(/\/(\d{4,5}[A-Za-z]?)-/);
  if (urlMatch) return urlMatch[1];

  // Last resort: generate from text
  const fallback = linkText.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
  return `UNK-${fallback}`;
}

/**
 * Extract title from link text (strip the policy number prefix)
 */
function extractTitle(linkText) {
  return linkText
    .replace(/^\d{4,5}[A-Za-z]?\s+/, '')  // Remove leading policy number
    .replace(/^[-–—]\s*/, '')               // Remove leading dash
    .trim();
}

async function scrapeSectionPage(section) {
  console.log(`  Fetching ${section.url}...`);

  const response = await fetch(section.url, {
    headers: {
      'User-Agent': 'NorCalEMSGuide-Builder/1.0 (offline field reference tool)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${section.url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const policies = [];
  const skipped = [];
  let currentSubsection = section.sectionName; // Default subsection = section name

  // Walk through the main content area
  const contentArea = $('.entry-content, .post-content, article, main').first();
  const container = contentArea.length ? contentArea : $('body');

  // Track subsection headings (h2, h5 with id patterns)
  container.find('h2, h3, h4, h5, a').each((_, el) => {
    const tag = el.tagName.toLowerCase();

    // Update current subsection on heading elements
    if (['h2', 'h3', 'h4', 'h5'].includes(tag)) {
      const headingText = $(el).text().trim();
      if (headingText && headingText.match(/^\d/)) {
        currentSubsection = headingText;
      } else if (headingText && headingText.length > 2) {
        currentSubsection = headingText;
      }
      return;
    }

    // Process links
    if (tag === 'a') {
      const href = $(el).attr('href') || '';
      const linkText = $(el).text().trim();

      // Skip empty links
      if (!href || !linkText) return;

      // Only process PDF links on norcalems.org
      if (href.includes('.pdf') && href.includes('norcalems.org')) {
        const id = extractPolicyId(linkText, href);
        const title = extractTitle(linkText) || linkText;

        policies.push({
          id,
          title,
          pdfUrl: href,
          section: section.sectionName,
          subsection: currentSubsection,
          linkText, // Keep original for debugging
        });
      } else if (
        href.includes('forms.office.com') ||
        href.includes('youtube.com') ||
        href.includes('youtu.be') ||
        (!href.includes('.pdf') && !href.includes('norcalems.org/wp-content'))
      ) {
        skipped.push({
          text: linkText,
          url: href,
          reason: 'Non-PDF external link',
        });
      }
      // Also skip .pptx and other non-PDF uploads
      else if (href.includes('norcalems.org') && !href.includes('.pdf')) {
        skipped.push({
          text: linkText,
          url: href,
          reason: 'Non-PDF file on norcalems.org',
        });
      }
    }
  });

  return { policies, skipped };
}

export async function scrapePolicies() {
  console.log('=== Step 1: Scraping policy index pages ===\n');

  await mkdir(OUTPUT_DIR, { recursive: true });

  const allPolicies = [];
  const allSkipped = [];
  const sectionCounts = {};

  for (const section of SECTION_PAGES) {
    try {
      const { policies, skipped } = await scrapeSectionPage(section);
      allPolicies.push(...policies);
      allSkipped.push(...skipped.map(s => ({ ...s, section: section.sectionName })));
      sectionCounts[section.sectionName] = policies.length;
      console.log(`  ✓ ${section.sectionName}: ${policies.length} PDFs found, ${skipped.length} skipped`);
    } catch (err) {
      console.error(`  ✗ ${section.sectionName}: ${err.message}`);
      sectionCounts[section.sectionName] = 0;
    }
  }

  // Deduplicate by PDF URL (some policies may appear on multiple pages)
  const seen = new Set();
  const deduplicated = allPolicies.filter(p => {
    if (seen.has(p.pdfUrl)) return false;
    seen.add(p.pdfUrl);
    return true;
  });

  const output = {
    scrapedAt: new Date().toISOString(),
    totalPolicies: deduplicated.length,
    sectionCounts,
    policies: deduplicated,
    skipped: allSkipped,
  };

  const outputPath = join(OUTPUT_DIR, 'scraped-policies.json');
  await writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n  Total: ${deduplicated.length} unique PDFs found`);
  console.log(`  Skipped: ${allSkipped.length} non-PDF links`);
  console.log(`  Output: ${outputPath}\n`);

  return output;
}

// Run standalone
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapePolicies().catch(err => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
}
