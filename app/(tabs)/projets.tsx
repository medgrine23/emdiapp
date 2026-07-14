import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { Carte } from '@/components/Carte';
import { Fab } from '@/components/Fab';
import { useCollection } from '@/hooks/useRepository';
import { LIBELLE_STATUT_PROJET, projetsRepo } from '@/services/projetService';
import { couleurs, espacements } from '@/theme/theme';
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.vide}>
            {chargement ? 'Chargement…' : 'Aucun projet. Appuyez sur + pour en créer un.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Carte onPress={() => router.push(`/(modules)/projets/${item.id}`)}>
            <View style={styles.ligneHaut}>
              <Text style={styles.ref}>{item.reference}</Text>
              <BadgeEtat etat={item.etat} />
            </View>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.meta}>
              {LIBELLE_STATUT_PROJET[item.statut]} · {item.localisation.ville ?? '—'}
            </Text>
            <View style={styles.pied}>
              <Feather name="dollar-sign" size={14} color={couleurs.texteSecondaire} />
              <Text style={styles.budget}>{formaterMontant(item.budgetAlloue)}</Text>
            </View>
          </Carte>
        )}
      />

      <Fab onPress={() => router.push('/(modules)/projets/formulaire')} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm, paddingBottom: 90 },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 12, fontWeight: '800', color: couleurs.primaireClair, letterSpacing: 0.3 },
  nom: { fontSize: 17, fontWeight: '700', color: couleurs.texte, marginTop: espacements.xs },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  pied: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: espacements.sm },
  budget: { fontSize: 14, fontWeight: '700', color: couleurs.texte },
});
