import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import {
  facturesRepo,
  LIBELLE_STATUT_FACTURE,
  LIBELLE_TYPE_FACTURE,
  resteAPayer,
} from '@/services/factureService';
import { projetsRepo } from '@/services/projetService';
import { useCollection } from '@/hooks/useRepository';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterDate, formaterMontant } from '@/utils/format';

export default function ListeFactures() {
  const router = useRouter();
  const { items, chargement } = useCollection(facturesRepo);
  const { items: projets } = useCollection(projetsRepo);
  const refProjet = (id: string) => projets.find((p) => p.id === id)?.reference ?? '—';

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={items}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>
            {chargement ? 'Chargement…' : 'Aucune facture. Appuyez sur + pour en créer une.'}
          </Text>
        }
        renderItem={({ item }) => {
          const reste = resteAPayer(item);
          return (
            <Link href={`/(modules)/facturation/${item.id}`} asChild>
              <Pressable style={styles.carte}>
                <View style={styles.ligneHaut}>
                  <Text style={styles.numero}>{item.numero}</Text>
                  <BadgeEtat etat={item.etat} />
                </View>
                <Text style={styles.sous}>
                  {LIBELLE_TYPE_FACTURE[item.type]} · Projet {refProjet(item.projetId)} · {formaterDate(item.date)}
                </Text>
                <View style={styles.ligneBas}>
                  <Text style={styles.statut}>{LIBELLE_STATUT_FACTURE[item.statut]}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.total}>{formaterMontant(item.totalTTC)} TTC</Text>
                    {reste > 0 ? <Text style={styles.reste}>Reste {formaterMontant(reste)}</Text> : null}
                  </View>
                </View>
              </Pressable>
            </Link>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(modules)/facturation/formulaire')}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  ligneBas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: espacements.sm },
  statut: { fontSize: 13, color: couleurs.primaireClair, fontWeight: '600' },
  total: { fontSize: 15, fontWeight: '700', color: couleurs.texte },
  reste: { fontSize: 12, color: couleurs.alerte, fontWeight: '600', marginTop: 2 },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '700' },
});
