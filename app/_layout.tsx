import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { amorcerDonnees } from '@/services/seed';
import { couleurs } from '@/theme/theme';

export default function RootLayout() {
  useEffect(() => {
    amorcerDonnees();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: couleurs.primaire },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: couleurs.fond },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'EMDI Chantiers' }} />
        <Stack.Screen name="(modules)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
