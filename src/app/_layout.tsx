import '@/global.css';

import type { ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider, useAppState } from '@/state/AppState';
import { ThemeProvider, useTheme } from '@/theme';
import { LanguageProvider } from '@/i18n';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <LocalizedTheme>
            <ThemedChrome />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.ivory },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </LocalizedTheme>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Wires the UI language (seeded from the signed-in account) + theme together. */
function LocalizedTheme({ children }: { children: ReactNode }) {
  const { account } = useAppState();
  return (
    <LanguageProvider initialLanguage={account?.language}>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );
}

/** Status bar icons that follow the active theme. */
function ThemedChrome() {
  const { themeMode } = useTheme();
  return <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />;
}
