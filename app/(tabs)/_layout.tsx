import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { couleurs } from '@/theme/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.primaire },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: couleurs.primaire,
        tabBarInactiveTintColor: couleurs.texteSecondaire,
        tabBarStyle: {
          backgroundColor: couleurs.surface,
          borderTopColor: couleurs.bordure,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="projets"
        options={{ title: 'Projets', tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="planning"
        options={{ title: 'Planning', tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="achats"
        options={{ title: 'Achats', tabBarIcon: ({ color, size }) => <Feather name="shopping-cart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="rapports"
        options={{ title: 'Rapports', tabBarIcon: ({ color, size }) => <Feather name="clipboard" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
