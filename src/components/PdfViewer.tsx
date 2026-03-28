import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, Typography, Spacing, BorderRadius } from '../theme';
import { openPdf } from '../utils/openPdf';

interface PdfViewerProps {
  pdfFilename: string;
}

export function PdfViewer({ pdfFilename }: PdfViewerProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(async () => {
    setLoading(true);
    try {
      await openPdf(pdfFilename);
    } catch (err: any) {
      Alert.alert('Error', `Failed to open PDF: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [pdfFilename]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Icon name="file-pdf-box" size={64} color={theme.accent} />

      <Text style={[Typography.body, { color: theme.text, marginTop: Spacing.md, textAlign: 'center' }]}>
        {pdfFilename}
      </Text>

      <TouchableOpacity
        onPress={handleOpen}
        disabled={loading}
        activeOpacity={0.7}
        style={[styles.button, { backgroundColor: theme.accent }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="open-in-new" size={20} color="#fff" />
            <Text style={styles.buttonText}>Open PDF</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[Typography.caption, { color: theme.textTertiary, marginTop: Spacing.lg, textAlign: 'center' }]}>
        Opens in your preferred PDF viewer app
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    minWidth: 160,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
