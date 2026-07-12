/** Pastille colorée représentant l'état du cycle de vie d'une entité (§2). */
import { StyleSheet, Text, View } from 'react-native';

import { couleurs, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';

const CONFIG: Record<EtatEntite, { libelle: string; couleur: string }> = {
  [EtatEntite.Actif]: { libelle: 'Actif', couleur: couleurs.succes },
  [EtatEntite.Archive]: { libelle: 'Archivé', couleur: couleurs.texteSecondaire },
  [EtatEntite.Annule]: { libelle: 'Annulé', couleur: couleurs.danger },
  [EtatEntite.Supprime]: { libelle: 'Supprimé', couleur: couleurs.alerte },
};

export function BadgeEtat({ etat }: { etat: EtatEntite }) {
  const { libelle, couleur } = CONFIG[etat];
  return (
    <View style={[styles.badge, { backgroundColor: `${couleur}1A`, borderColor: couleur }]}>
      <Text style={[styles.texte, { color: couleur }]}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: rayons.sm,
    borderWidth: 1,
  },
  texte: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
