import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LoginScreen } from '@/auth/LoginScreen';
import { amorcerDonnees } from '@/services/seed';
import { couleurs } from '@/theme/theme';

export default function RootLayout() {
  useEffect(() => {
    amorcerDonnees();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RacineNavigation />
    </AuthProvider>
  );
}

function RacineNavigation() {
  const { user, chargement, demo } = useAuth();

  if (chargement) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.primaire }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Firebase actif et non connecté → écran de connexion.
  if (!demo && !user) {
    return <LoginScreen />;
  }

  return (
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
  );
}
