import { Link } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { authDisponible, deconnexion } from '@/services/authService';
import { couleurs, espacements, rayons } from '@/theme/theme';

const SECTIONS = [
  { route: '/(modules)/parametres/entreprise', icone: '🏢', titre: 'Entreprise', desc: 'Nom, adresse, SIRET, TVA' },
  { route: '/(modules)/parametres/roles', icone: '🔐', titre: 'Rôles & permissions', desc: 'Droits d\'accès par profil' },
  { route: '/(modules)/parametres/taxes', icone: '％', titre: 'Taxes', desc: 'Taux de TVA et taxes' },
  { route: '/(modules)/parametres/clients', icone: '👤', titre: 'Clients', desc: 'Référentiel des clients' },
  { route: '/(modules)/parametres/fournisseurs', icone: '🚚', titre: 'Fournisseurs', desc: 'Référentiel des fournisseurs' },
  { route: '/(modules)/parametres/notifications', icone: '🔔', titre: 'Notifications', desc: 'Préférences de notification' },
];

export default function EcranParametres() {
  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      {SECTIONS.map((s) => (
        <Link key={s.route} href={s.route as never} asChild>
          <Pressable style={styles.carte}>
            <Text style={styles.icone}>{s.icone}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{s.titre}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
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
  icone: { fontSize: 24, width: 32, textAlign: 'center' },
  titre: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  desc: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  chevron: { fontSize: 26, color: couleurs.texteSecondaire },
  deconnexion: { marginTop: espacements.md, borderWidth: 1.5, borderColor: couleurs.danger, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center' },
  deconnexionTexte: { color: couleurs.danger, fontWeight: '700', fontSize: 15 },
});
