import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme, Typography, Spacing } from './theme';
import { ProviderFilterProvider, useProviderFilterState } from './hooks/useProviderFilter';
import { RootNavigator } from './navigation/RootNavigator';
import { initDatabase } from './database';

function AppContent() {
  const { theme } = useTheme();
  const providerFilterState = useProviderFilterState();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err: any) {
        console.error('Database init failed:', err);
        setDbError(err.message || 'Failed to initialize database');
      }
    }
    setup();
  }, []);

  if (dbError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <Text style={[Typography.h2, { color: theme.danger, textAlign: 'center' }]}>
          Setup Error
        </Text>
        <Text
          style={[
            Typography.body,
            { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md },
          ]}
        >
          {dbError}
        </Text>
        <Text
          style={[
            Typography.caption,
            { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.lg },
          ]}
        >
          Try reinstalling the app or contact your administrator.
        </Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text
          style={[
            Typography.label,
            { color: theme.textSecondary, marginTop: Spacing.lg },
          ]}
        >
          Setting up...
        </Text>
      </View>
    );
  }

  return (
    <ProviderFilterProvider value={providerFilterState}>
      <RootNavigator />
    </ProviderFilterProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
