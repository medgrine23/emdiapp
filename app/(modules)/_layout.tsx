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
      <Stack.Screen name="projets/[id]" options={{ title: 'Projet' }} />
      <Stack.Screen name="projets/formulaire" options={{ title: 'Nouveau projet' }} />
      <Stack.Screen name="devis/index" options={{ title: 'Devis quantitatif' }} />
      <Stack.Screen name="devis/[id]" options={{ title: 'Devis' }} />
      <Stack.Screen name="devis/formulaire" options={{ title: 'Nouveau devis' }} />
      <Stack.Screen name="planning/index" options={{ title: 'Planning' }} />
      <Stack.Screen name="planning/[id]" options={{ title: 'Tâche' }} />
      <Stack.Screen name="planning/formulaire" options={{ title: 'Nouvelle tâche' }} />
      <Stack.Screen name="achats/index" options={{ title: 'Achats' }} />
      <Stack.Screen name="achats/[id]" options={{ title: 'Bon de commande' }} />
      <Stack.Screen name="achats/formulaire" options={{ title: 'Nouveau bon de commande' }} />
      <Stack.Screen name="facturation/index" options={{ title: 'Facturation' }} />
      <Stack.Screen name="facturation/[id]" options={{ title: 'Facture' }} />
      <Stack.Screen name="facturation/formulaire" options={{ title: 'Nouvelle facture' }} />
      <Stack.Screen name="rapports/index" options={{ title: 'Rapports' }} />
      <Stack.Screen name="rapports/[id]" options={{ title: 'Rapport' }} />
      <Stack.Screen name="rapports/formulaire" options={{ title: 'Nouveau rapport' }} />
      <Stack.Screen name="documentation/index" options={{ title: 'Documentation' }} />
      <Stack.Screen name="documentation/[id]" options={{ title: 'Document' }} />
      <Stack.Screen name="documentation/formulaire" options={{ title: 'Nouveau document' }} />
      <Stack.Screen name="chat/index" options={{ title: 'Chat interne' }} />
      <Stack.Screen name="chat/[id]" options={{ title: 'Conversation' }} />
      <Stack.Screen name="chat/formulaire" options={{ title: 'Nouvelle conversation' }} />
      <Stack.Screen name="parametres/index" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="parametres/entreprise" options={{ title: 'Entreprise' }} />
      <Stack.Screen name="parametres/roles" options={{ title: 'Rôles & permissions' }} />
      <Stack.Screen name="parametres/taxes" options={{ title: 'Taxes' }} />
      <Stack.Screen name="parametres/clients" options={{ title: 'Clients' }} />
      <Stack.Screen name="parametres/fournisseurs" options={{ title: 'Fournisseurs' }} />
      <Stack.Screen name="parametres/notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
