/**
 * Modale de saisie du motif d'annulation. Le cahier des charges (§2) impose un
 * motif OBLIGATOIRE pour annuler un document validé.
 */
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { couleurs, espacements, rayons } from '@/theme/theme';

export function ModalAnnulation({
  visible,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  onAnnuler: () => void;
  onConfirmer: (motif: string) => void;
}) {
  const [motif, setMotif] = useState('');
  const valide = motif.trim().length > 0;

  const confirmer = () => {
    if (!valide) return;
    onConfirmer(motif.trim());
    setMotif('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <Text style={styles.titre}>Motif d'annulation</Text>
          <Text style={styles.sous}>Le motif est obligatoire et sera conservé (traçabilité).</Text>
          <TextInput
            style={styles.champ}
            placeholder="Saisir le motif…"
            value={motif}
            onChangeText={setMotif}
            multiline
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
              <Text style={styles.secondaireTexte}>Retour</Text>
            </Pressable>
            <Pressable
              style={[styles.bouton, valide ? styles.danger : styles.desactive]}
              onPress={confirmer}
              disabled={!valide}
            >
              <Text style={styles.dangerTexte}>Confirmer l'annulation</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: espacements.lg,
  },
  boite: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    padding: espacements.lg,
  },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte },
  sous: {
    fontSize: 13,
    color: couleurs.texteSecondaire,
    marginTop: espacements.xs,
    marginBottom: espacements.md,
  },
  champ: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.sm,
    padding: espacements.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    color: couleurs.texte,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espacements.sm,
    marginTop: espacements.md,
  },
  bouton: {
    paddingVertical: espacements.sm,
    paddingHorizontal: espacements.md,
    borderRadius: rayons.sm,
  },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  danger: { backgroundColor: couleurs.danger },
  desactive: { backgroundColor: couleurs.bordure },
  dangerTexte: { color: '#fff', fontWeight: '700' },
});
