import { Platform, Linking, Alert } from 'react-native';
import RNFS from 'react-native-blob-util';

/**
 * Copy a PDF from bundled Android assets to the cache directory (if not already there),
 * then launch Android's intent chooser so the user can open it in their preferred viewer.
 */
export async function openPdf(pdfFilename: string): Promise<void> {
  if (Platform.OS !== 'android') return;

  const cacheDir = RNFS.fs.dirs.CacheDir;
  const dest = `${cacheDir}/pdfs/${pdfFilename}`;

  // Ensure pdfs subdirectory exists
  const pdfsDir = `${cacheDir}/pdfs`;
  const dirExists = await RNFS.fs.exists(pdfsDir);
  if (!dirExists) {
    await RNFS.fs.mkdir(pdfsDir);
  }

  // Copy from assets on-demand (skip if already cached)
  const fileExists = await RNFS.fs.exists(dest);
  if (!fileExists) {
    await RNFS.fs.cp(
      RNFS.fs.asset(`pdfs/${pdfFilename}`),
      dest,
    );
  }

  try {
    await RNFS.android.actionViewIntent(dest, 'application/pdf', 'Open PDF with');
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.includes('No Activity found') || message.includes('no activity')) {
      Alert.alert(
        'No PDF Viewer Found',
        'Please install a PDF viewer app (e.g. Google Drive, Adobe Reader) from the Play Store.',
        [
          { text: 'Open Play Store', onPress: () => Linking.openURL('https://play.google.com/store/search?q=pdf+viewer&c=apps') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      throw err;
    }
  }
}
