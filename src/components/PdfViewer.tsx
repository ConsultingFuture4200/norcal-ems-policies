import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';
import { useTheme, Typography, Spacing } from '../theme';

interface PdfViewerProps {
  pdfFilename: string;
}

export function PdfViewer({ pdfFilename }: PdfViewerProps) {
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 0 });

  // Pass asset path directly to patched PdfView.java which uses fromAsset()
  // This bypasses react-native-blob-util entirely
  const assetPath = `/android_asset/pdfs/${pdfFilename}`;

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.surface }]}>
        <Text style={[Typography.body, { color: theme.danger, textAlign: 'center' }]}>
          Unable to load PDF
        </Text>
        <Text style={[Typography.caption, { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: assetPath }}
        style={[styles.pdf, { backgroundColor: theme.background }]}
        onLoadComplete={(numberOfPages) => {
          setLoading(false);
          setPageInfo(prev => ({ ...prev, total: numberOfPages }));
        }}
        onPageChanged={(page) => {
          setPageInfo(prev => ({ ...prev, current: page }));
        }}
        onError={(err) => {
          setLoading(false);
          setError(err.toString());
        }}
        enablePaging={false}
        fitPolicy={0}
        spacing={8}
      />

      {!loading && pageInfo.total > 0 && (
        <View style={[styles.pageIndicator, { backgroundColor: theme.surface + 'E0' }]}>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            {pageInfo.current} / {pageInfo.total}
          </Text>
        </View>
      )}

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.md }]}>
            Loading PDF...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
