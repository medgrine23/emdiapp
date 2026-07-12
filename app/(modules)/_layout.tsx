import { Stack } from 'expo-router';

import { couleurs } from '@/theme/theme';

export default function ModulesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.primaire },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: couleurs.fond },
      }}
    >
      <Stack.Screen name="projets/index" options={{ title: 'Projets' }} />
      <Stack.Screen name="devis/index" options={{ title: 'Devis quantitatif' }} />
      <Stack.Screen name="planning/index" options={{ title: 'Planning' }} />
      <Stack.Screen name="achats/index" options={{ title: 'Achats' }} />
      <Stack.Screen name="facturation/index" options={{ title: 'Facturation' }} />
      <Stack.Screen name="rapports/index" options={{ title: 'Rapports' }} />
      <Stack.Screen name="documentation/index" options={{ title: 'Documentation' }} />
      <Stack.Screen name="chat/index" options={{ title: 'Chat interne' }} />
      <Stack.Screen name="parametres/index" options={{ title: 'Paramètres' }} />
    </Stack>
  );
}
