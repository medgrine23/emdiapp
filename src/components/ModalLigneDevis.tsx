/** Modale de saisie/édition d'une ligne de devis. */
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterMontant } from '@/utils/format';

export interface SaisieLigne {
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
}

export function ModalLigneDevis({
  visible,
  valeurInitiale,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  valeurInitiale?: SaisieLigne | null;
  onAnnuler: () => void;
  onConfirmer: (ligne: SaisieLigne) => void;
}) {
  const [designation, setDesignation] = useState('');
  const [unite, setUnite] = useState('u');
  const [quantite, setQuantite] = useState('1');
  const [prixUnitaire, setPrixUnitaire] = useState('0');

  useEffect(() => {
    if (!visible) return;
    setDesignation(valeurInitiale?.designation ?? '');
    setUnite(valeurInitiale?.unite ?? 'u');
    setQuantite(valeurInitiale ? String(valeurInitiale.quantite) : '1');
    setPrixUnitaire(valeurInitiale ? String(valeurInitiale.prixUnitaire) : '0');
  }, [visible, valeurInitiale]);

  const q = Number(quantite.replace(',', '.')) || 0;
  const pu = Number(prixUnitaire.replace(',', '.')) || 0;
  const total = q * pu;
  const valide = designation.trim().length > 0;

  const confirmer = () => {
    if (!valide) return;
    onConfirmer({ designation: designation.trim(), unite: unite.trim() || 'u', quantite: q, prixUnitaire: pu });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <Text style={styles.titre}>{valeurInitiale ? 'Modifier la ligne' : 'Nouvelle ligne'}</Text>

          <Text style={styles.label}>Désignation *</Text>
          <TextInput style={styles.champ} value={designation} onChangeText={setDesignation} placeholder="Désignation de la prestation" autoFocus />

          <View style={styles.ligne}>
            <View style={styles.moitie}>
              <Text style={styles.label}>Unité</Text>
              <TextInput style={styles.champ} value={unite} onChangeText={setUnite} placeholder="u, m², ml…" />
            </View>
            <View style={styles.moitie}>
              <Text style={styles.label}>Quantité</Text>
              <TextInput style={styles.champ} value={quantite} onChangeText={setQuantite} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Prix unitaire (DZD)</Text>
          <TextInput style={styles.champ} value={prixUnitaire} onChangeText={setPrixUnitaire} keyboardType="numeric" />

          <Text style={styles.total}>Total ligne : {formaterMontant(total)}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
              <Text style={styles.secondaireTexte}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.bouton, valide ? styles.primaire : styles.desactive]} onPress={confirmer} disabled={!valide}>
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
  boite: {
    backgroundColor: couleurs.surface,
    borderTopLeftRadius: rayons.lg,
    borderTopRightRadius: rayons.lg,
    padding: espacements.lg,
  },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: {
    backgroundColor: couleurs.fond,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.sm,
    padding: espacements.sm,
    color: couleurs.texte,
    fontSize: 15,
  },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  total: { marginTop: espacements.md, fontSize: 16, fontWeight: '700', color: couleurs.primaire, textAlign: 'right' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  desactive: { backgroundColor: couleurs.bordure },
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
