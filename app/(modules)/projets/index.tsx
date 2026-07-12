import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { useCollection } from '@/hooks/useRepository';
import { LIBELLE_STATUT_PROJET, projetsRepo } from '@/services/projetService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterMontant } from '@/utils/format';

export default function ListeProjets() {
  const router = useRouter();
  const { items, chargement } = useCollection(projetsRepo);

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>
            {chargement ? 'Chargement…' : 'Aucun projet. Appuyez sur + pour en créer un.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Link href={`/(modules)/projets/${item.id}`} asChild>
            <Pressable style={styles.carte}>
              <View style={styles.ligneHaut}>
                <Text style={styles.ref}>{item.reference}</Text>
                <BadgeEtat etat={item.etat} />
              </View>
              <Text style={styles.nom}>{item.nom}</Text>
              <Text style={styles.meta}>
                {LIBELLE_STATUT_PROJET[item.statut]} · {item.localisation.ville ?? '—'}
              </Text>
              <Text style={styles.budget}>{formaterMontant(item.budgetAlloue)}</Text>
            </Pressable>
          </Link>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(modules)/projets/formulaire')}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espacements.md,
  },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 12, fontWeight: '700', color: couleurs.primaireClair },
  nom: { fontSize: 17, fontWeight: '700', color: couleurs.texte, marginTop: espacements.xs },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  budget: { fontSize: 14, fontWeight: '600', color: couleurs.texte, marginTop: espacements.sm },
  fab: {
    position: 'absolute',
    right: espacements.lg,
    bottom: espacements.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: couleurs.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabTexte: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '700' },
});
