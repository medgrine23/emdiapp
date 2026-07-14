import { useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { useCollection } from '@/hooks/useRepository';
import { documentsRepo, formaterTaille, ICONE_TYPE_DOCUMENT, LIBELLE_TYPE_DOCUMENT } from '@/services/documentService';
import { projetsRepo } from '@/services/projetService';
import { couleurs, espacements, rayons } from '@/theme/theme';

export default function ListeDocuments() {
  const router = useRouter();
  const { items, chargement } = useCollection(documentsRepo);
  const { items: projets } = useCollection(projetsRepo);
  const [filtreProjet, setFiltreProjet] = useState<string | null>(null);

  const refProjet = (id?: string | null) => (id ? projets.find((p) => p.id === id)?.reference ?? '—' : 'Global');
  const documents = useMemo(
    () => (filtreProjet ? items.filter((d) => d.projetId === filtreProjet) : items),
    [items, filtreProjet]
  );

  return (
    <View style={styles.conteneur}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtres} contentContainerStyle={styles.filtresContenu}>
        <Chip label="Tous" actif={!filtreProjet} onPress={() => setFiltreProjet(null)} />
        {projets.map((p) => (
          <Chip key={p.id} label={p.reference} actif={filtreProjet === p.id} onPress={() => setFiltreProjet(p.id)} />
        ))}
      </ScrollView>

      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>{chargement ? 'Chargement…' : 'Aucun document. Appuyez sur + pour en ajouter.'}</Text>
        }
        renderItem={({ item }) => (
          <Link href={`/(modules)/documentation/${item.id}`} asChild>
            <Pressable style={styles.carte}>
              <Text style={styles.icone}>{ICONE_TYPE_DOCUMENT[item.type]}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.ligneHaut}>
                  <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                  <BadgeEtat etat={item.etat} />
                </View>
                <Text style={styles.meta}>
                  {LIBELLE_TYPE_DOCUMENT[item.type]} · {refProjet(item.projetId)} · {formaterTaille(item.tailleOctets)}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(modules)/documentation/formulaire')}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, actif, onPress }: { label: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, actif && styles.chipActif]} onPress={onPress}>
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  filtres: { maxHeight: 52, backgroundColor: couleurs.surface, borderBottomWidth: 1, borderBottomColor: couleurs.bordure },
  filtresContenu: { padding: espacements.sm, gap: espacements.xs, alignItems: 'center' },
  liste: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  carte: { flexDirection: 'row', alignItems: 'center', gap: espacements.md, backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  icone: { fontSize: 28 },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espacements.sm },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte, flex: 1 },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: couleurs.surAccent, fontSize: 30, lineHeight: 34, fontWeight: '700' },
});
