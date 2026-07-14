import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { Carte } from '@/components/Carte';
import { Fab } from '@/components/Fab';
import { useCollection } from '@/hooks/useRepository';
import { projetsRepo } from '@/services/projetService';
import { LIBELLE_TYPE_RAPPORT, rapportsRepo } from '@/services/rapportService';
import { couleurs, espacements, ombres, rayons } from '@/theme/theme';
import { formaterDate } from '@/utils/format';

export default function ListeRapports() {
  const router = useRouter();
  const { items, chargement } = useCollection(rapportsRepo);
  const { items: projets } = useCollection(projetsRepo);
  const refProjet = (id: string) => projets.find((p) => p.id === id)?.reference ?? '—';

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Pressable style={styles.exportBar} onPress={() => router.push('/(modules)/rapports/export')}>
            <View style={styles.exportIcone}>
              <Feather name="download" size={18} color={couleurs.surAccent} />
            </View>
            <Text style={styles.exportTexte}>Exporter un rapport (PDF / Excel)</Text>
            <Feather name="chevron-right" size={20} color={couleurs.texteSecondaire} />
          </Pressable>
        }
        ListEmptyComponent={
          <Text style={styles.vide}>{chargement ? 'Chargement…' : 'Aucun rapport. Appuyez sur + pour en créer un.'}</Text>
        }
        renderItem={({ item }) => (
          <Carte onPress={() => router.push(`/(modules)/rapports/${item.id}`)}>
            <View style={styles.ligneHaut}>
              <Text style={styles.type}>{LIBELLE_TYPE_RAPPORT[item.type]}</Text>
              <BadgeEtat etat={item.etat} />
            </View>
            <Text style={styles.date}>{formaterDate(item.date)} · Projet {refProjet(item.projetId)}</Text>
            <Text style={styles.meta}>
              {item.meteo ? `${item.meteo.condition} · ` : ''}{item.effectifPresent} présent(s)
              {item.meteo?.intemperie ? ' · ⚠ intempérie' : ''}
            </Text>
          </Carte>
        )}
      />

      <Fab onPress={() => router.push('/(modules)/rapports/formulaire')} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm, paddingBottom: 90 },
  exportBar: {
    flexDirection: 'row', alignItems: 'center', gap: espacements.sm,
    backgroundColor: couleurs.surface, borderRadius: rayons.md, padding: espacements.md,
    marginBottom: espacements.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: couleurs.bordure, ...ombres.douce,
  },
  exportIcone: { width: 34, height: 34, borderRadius: 10, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center' },
  exportTexte: { flex: 1, fontSize: 14, fontWeight: '700', color: couleurs.texte },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 16, fontWeight: '800', color: couleurs.texte },
  date: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: espacements.xs },
});
