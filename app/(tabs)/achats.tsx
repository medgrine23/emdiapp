import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { Carte } from '@/components/Carte';
import { Fab } from '@/components/Fab';
import { bonsCommandeRepo, fournisseursRepo, LIBELLE_STATUT_BON_COMMANDE } from '@/services/achatService';
import { projetsRepo } from '@/services/projetService';
import { useCollection } from '@/hooks/useRepository';
import { couleurs, espacements } from '@/theme/theme';
import { formaterDate, formaterMontant } from '@/utils/format';

export default function ListeAchats() {
  const router = useRouter();
  const { items, chargement } = useCollection(bonsCommandeRepo);
  const { items: projets } = useCollection(projetsRepo);
  const { items: fournisseurs } = useCollection(fournisseursRepo);
  const refProjet = (id: string) => projets.find((p) => p.id === id)?.reference ?? '—';
  const nomFournisseur = (id: string) => fournisseurs.find((f) => f.id === id)?.nom ?? '—';

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.vide}>
            {chargement ? 'Chargement…' : 'Aucun bon de commande. Appuyez sur + pour en créer un.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Carte onPress={() => router.push(`/(modules)/achats/${item.id}`)}>
            <View style={styles.ligneHaut}>
              <Text style={styles.numero}>{item.numero}</Text>
              <BadgeEtat etat={item.etat} />
            </View>
            <Text style={styles.sous}>
              {nomFournisseur(item.fournisseurId)} · Projet {refProjet(item.projetId)} · {formaterDate(item.date)}
            </Text>
            <View style={styles.ligneBas}>
              <Text style={styles.statut}>{LIBELLE_STATUT_BON_COMMANDE[item.statut]}</Text>
              <Text style={styles.total}>{formaterMontant(item.totalHT)} HT</Text>
            </View>
          </Carte>
        )}
      />

      <Fab onPress={() => router.push('/(modules)/achats/formulaire')} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm, paddingBottom: 90 },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 16, fontWeight: '800', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  ligneBas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espacements.sm },
  statut: { fontSize: 13, color: couleurs.primaireClair, fontWeight: '700' },
  total: { fontSize: 15, fontWeight: '800', color: couleurs.texte },
});
