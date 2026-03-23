import { Platform } from 'react-native';
import RNFS from 'react-native-blob-util';

/**
 * Get the local file path for a bundled PDF.
 * PDFs are copied from assets to DocumentDir on first launch.
 */
export function getPdfPath(pdfFilename: string): string {
  const docDir = RNFS.fs.dirs.DocumentDir;
  return `${docDir}/pdfs/${pdfFilename}`;
}

/**
 * Check if a PDF exists locally
 */
export async function pdfExists(pdfFilename: string): Promise<boolean> {
  const path = getPdfPath(pdfFilename);
  return RNFS.fs.exists(path);
}

/**
 * Copy all PDFs from assets to writable storage on first launch.
 * This is called during app initialization.
 */
export async function copyPdfsFromAssets(
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const docDir = RNFS.fs.dirs.DocumentDir;
  const pdfsDir = `${docDir}/pdfs`;

  // Check if already copied
  const dirExists = await RNFS.fs.exists(pdfsDir);
  if (dirExists) {
    // Quick check: if directory exists and has files, skip copy
    const files = await RNFS.fs.ls(pdfsDir);
    if (files.length > 10) return; // Already populated
  }

  await RNFS.fs.mkdir(pdfsDir);

  // Read list of PDFs from assets
  // Note: Android assets can't be listed directly, so we use the
  // policies database to know which PDFs to expect
  // The actual copy happens during database init
}

/**
 * Get the Android asset URI for a PDF (used as fallback)
 */
export function getPdfAssetUri(pdfFilename: string): string {
  if (Platform.OS === 'android') {
    return `bundle-assets://pdfs/${pdfFilename}`;
  }
  return '';
}
