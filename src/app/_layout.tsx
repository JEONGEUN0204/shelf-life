import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NotificationBridge } from '@/components/notification-bridge';
import { AppFont } from '@/constants/theme';
import { DATABASE_NAME, migrateDb } from '@/db/schema';
import { useSchemeName, useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useSchemeName();
  const theme = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDb}>
        <NotificationBridge />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTintColor: theme.accent,
            headerTitleStyle: { fontFamily: AppFont },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="item/new" options={{ title: '새 항목', presentation: 'modal' }} />
          <Stack.Screen name="item/[id]" options={{ title: '항목 수정' }} />
        </Stack>
      </SQLiteProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}
