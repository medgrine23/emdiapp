/**
 * Écran placeholder générique d'un module. Il rappelle les actions standard
 * imposées (§2) que l'implémentation devra fournir. À remplacer par les écrans
 * réels (liste, détail, formulaire) lors du développement de chaque module.
 */
import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '@/theme/theme';

const ACTIONS_STANDARD = [
  'Créer',
  'Consulter',
  'Modifier',
  'Supprimer (soft-delete)',
  'Archiver',
  'Annuler (motif obligatoire)',
];

export function EcranModule({
  titre,
  description,
}: {
  titre: string;
  description: string;
}) {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.carte}>
        <Text style={styles.carteTitre}>Actions standard à implémenter</Text>
        {ACTIONS_STANDARD.map((a) => (
          <Text key={a} style={styles.action}>
            • {a}
          </Text>
        ))}
      </View>

      <Text style={styles.note}>
        Écran provisoire — à connecter aux services Firestore (voir src/services/crud.ts).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, padding: espacements.lg, backgroundColor: couleurs.fond },
  titre: { fontSize: 24, fontWeight: '700', color: couleurs.texte },
  description: {
    fontSize: 15,
    color: couleurs.texteSecondaire,
    marginTop: espacements.sm,
    marginBottom: espacements.lg,
  },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espacements.md,
  },
  carteTitre: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: couleurs.primaire,
    marginBottom: espacements.sm,
  },
  action: { fontSize: 15, color: couleurs.texte, paddingVertical: 2 },
  note: {
    marginTop: espacements.lg,
    fontSize: 13,
    fontStyle: 'italic',
    color: couleurs.texteSecondaire,
  },
});
