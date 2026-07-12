/** Modale de saisie d'un paiement (encaissement d'une facture). */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LIBELLE_MODE_PAIEMENT } from '@/services/factureService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { ModePaiement } from '@/types/models';
import { formaterMontant } from '@/utils/format';

const MODES = Object.keys(LIBELLE_MODE_PAIEMENT) as ModePaiement[];

export interface SaisiePaiement {
  montant: number;
  mode: ModePaiement;
  reference?: string;
}

export function ModalPaiement({
  visible,
  resteAPayer,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  resteAPayer: number;
  onAnnuler: () => void;
  onConfirmer: (p: SaisiePaiement) => void;
}) {
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState<ModePaiement>('virement');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (!visible) return;
    setMontant(resteAPayer > 0 ? String(resteAPayer) : '');
    setMode('virement');
    setReference('');
  }, [visible, resteAPayer]);

  const valeur = Number(montant.replace(/\s/g, '').replace(',', '.')) || 0;
  const valide = valeur > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <Text style={styles.titre}>Enregistrer un paiement</Text>
          <Text style={styles.reste}>Reste à payer : {formaterMontant(resteAPayer)}</Text>

          <Text style={styles.label}>Montant (DZD) *</Text>
          <TextInput style={styles.champ} value={montant} onChangeText={setMontant} keyboardType="numeric" autoFocus />

          <Text style={styles.label}>Mode</Text>
          <View style={styles.chips}>
            {MODES.map((m) => (
              <Pressable key={m} style={[styles.chip, mode === m && styles.chipActif]} onPress={() => setMode(m)}>
                <Text style={[styles.chipTexte, mode === m && styles.chipTexteActif]}>{LIBELLE_MODE_PAIEMENT[m]}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Référence</Text>
          <TextInput style={styles.champ} value={reference} onChangeText={setReference} placeholder="N° chèque, réf. virement…" />

          <View style={styles.actions}>
            <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
              <Text style={styles.secondaireTexte}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.bouton, valide ? styles.primaire : styles.desactive]}
              onPress={() => valide && onConfirmer({ montant: valeur, mode, reference: reference.trim() || undefined })}
              disabled={!valide}
            >
              <Text style={styles.primaireTexte}>Valider</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte },
  reste: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  desactive: { backgroundColor: couleurs.bordure },
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
