import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MODULES } from '@/modules/registry';
import { couleurs, espacements, rayons } from '@/theme/theme';

export default function Accueil() {
  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <Text style={styles.sousTitre}>Gestion centralisée des chantiers</Text>
      <View style={styles.grille}>
        {MODULES.map((m) => (
          <Link key={m.cle} href={m.route as never} asChild>
            <Pressable style={styles.carte}>
              <Text style={styles.icone}>{m.icone}</Text>
              <Text style={styles.carteTitre}>{m.titre}</Text>
              <Text style={styles.carteDesc} numberOfLines={3}>
                {m.description}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { padding: espacements.md },
  sousTitre: {
    fontSize: 15,
    color: couleurs.texteSecondaire,
    marginBottom: espacements.md,
    marginLeft: espacements.xs,
  },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  carte: {
    width: '48%',
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espacements.md,
    marginBottom: espacements.md,
    minHeight: 140,
  },
  icone: { fontSize: 30, marginBottom: espacements.sm },
  carteTitre: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  carteDesc: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
    marginTop: espacements.xs,
  },
});
