import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { useCollection } from '@/hooks/useRepository';
import { projetsRepo } from '@/services/projetService';
import { LIBELLE_TYPE_RAPPORT, rapportsRepo } from '@/services/rapportService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterDate } from '@/utils/format';

export default function ListeRapports() {
  const router = useRouter();
  const { items, chargement } = useCollection(rapportsRepo);
  const { items: projets } = useCollection(projetsRepo);
  const refProjet = (id: string) => projets.find((p) => p.id === id)?.reference ?? '—';

  return (
    <View style={styles.conteneur}>
      <Link href="/(modules)/rapports/export" asChild>
        <Pressable style={styles.exportBar}>
          <Feather name="download" size={18} color={couleurs.primaireClair} />
          <Text style={styles.exportTexte}>Exporter un rapport (PDF / Excel)</Text>
          <Feather name="chevron-right" size={20} color={couleurs.texteSecondaire} />
        </Pressable>
      </Link>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>{chargement ? 'Chargement…' : 'Aucun rapport. Appuyez sur + pour en créer un.'}</Text>
        }
        renderItem={({ item }) => (
          <Link href={`/(modules)/rapports/${item.id}`} asChild>
            <Pressable style={styles.carte}>
              <View style={styles.ligneHaut}>
                <Text style={styles.type}>{LIBELLE_TYPE_RAPPORT[item.type]}</Text>
                <BadgeEtat etat={item.etat} />
              </View>
              <Text style={styles.date}>{formaterDate(item.date)} · Projet {refProjet(item.projetId)}</Text>
              <Text style={styles.meta}>
                {item.meteo ? `${item.meteo.condition} · ` : ''}{item.effectifPresent} présent(s)
                {item.meteo?.intemperie ? ' · ⚠ intempérie' : ''}
              </Text>
            </Pressable>
          </Link>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(modules)/rapports/formulaire')}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  exportBar: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, backgroundColor: couleurs.surface, borderBottomWidth: 1, borderBottomColor: couleurs.bordure, paddingVertical: espacements.md, paddingHorizontal: espacements.md },
  exportTexte: { flex: 1, fontSize: 14, fontWeight: '700', color: couleurs.primaireClair },
  liste: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  date: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: espacements.xs },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: couleurs.surAccent, fontSize: 30, lineHeight: 34, fontWeight: '700' },
});
