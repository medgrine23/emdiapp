import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { authDisponible, deconnexion } from '@/services/authService';
import { couleurs, espacements, rayons } from '@/theme/theme';

type NomIcone = ComponentProps<typeof Feather>['name'];

const SECTIONS: { route: string; icone: NomIcone; titre: string; desc: string }[] = [
  { route: '/(modules)/parametres/entreprise', icone: 'briefcase', titre: 'Entreprise', desc: 'Raison sociale, NIF, NIS, RC…' },
  { route: '/(modules)/parametres/theme', icone: 'droplet', titre: 'Thème & apparence', desc: 'Clair, sombre ou automatique' },
  { route: '/(modules)/parametres/roles', icone: 'lock', titre: 'Rôles & permissions', desc: 'Droits d\'accès par profil' },
  { route: '/(modules)/parametres/taxes', icone: 'percent', titre: 'Taxes', desc: 'Taux de TVA et taxes' },
  { route: '/(modules)/parametres/clients', icone: 'user', titre: 'Clients', desc: 'Référentiel des clients' },
  { route: '/(modules)/parametres/fournisseurs', icone: 'truck', titre: 'Fournisseurs', desc: 'Référentiel des fournisseurs' },
  { route: '/(modules)/parametres/notifications', icone: 'bell', titre: 'Notifications', desc: 'Préférences de notification' },
];

export default function EcranParametres() {
  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      {SECTIONS.map((s) => (
        <Link key={s.route} href={s.route as never} asChild>
          <Pressable style={styles.carte}>
            <View style={styles.iconeBox}>
              <Feather name={s.icone} size={20} color={couleurs.primaireClair} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{s.titre}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
            <Feather name="chevron-right" size={22} color={couleurs.texteSecondaire} />
          </Pressable>
        </Link>
      ))}

      {authDisponible ? (
        <Pressable
          style={styles.deconnexion}
          onPress={() =>
            Alert.alert('Déconnexion', 'Se déconnecter de l\'application ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Se déconnecter', style: 'destructive', onPress: () => deconnexion() },
            ])
          }
        >
          <Text style={styles.deconnexionTexte}>Se déconnecter</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, gap: espacements.sm },
  carte: { flexDirection: 'row', alignItems: 'center', gap: espacements.md, backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  iconeBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: `${couleurs.primaire}14`, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  desc: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  deconnexion: { marginTop: espacements.md, borderWidth: 1.5, borderColor: couleurs.danger, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center' },
  deconnexionTexte: { color: couleurs.danger, fontWeight: '700', fontSize: 15 },
});
