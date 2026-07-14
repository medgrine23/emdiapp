/**
 * Modale de saisie/édition d'une ligne d'achat. Permet de la rattacher à une
 * ligne du devis quantitatif : une alerte s'affiche en direct si la quantité ou
 * le prix unitaire dépasse la référence du devis (§3.2/§3.4).
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { evaluerDepassement } from '@/services/achatService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { LigneDevis } from '@/types/models';
import { formaterMontant } from '@/utils/format';

export interface SaisieLigneAchat {
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  ligneDevisId: string | null;
}

export function ModalLigneAchat({
  visible,
  valeurInitiale,
  lignesDevis,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  valeurInitiale?: SaisieLigneAchat | null;
  lignesDevis: LigneDevis[];
  onAnnuler: () => void;
  onConfirmer: (ligne: SaisieLigneAchat) => void;
}) {
  const [designation, setDesignation] = useState('');
  const [unite, setUnite] = useState('u');
  const [quantite, setQuantite] = useState('1');
  const [prixUnitaire, setPrixUnitaire] = useState('0');
  const [ligneDevisId, setLigneDevisId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDesignation(valeurInitiale?.designation ?? '');
    setUnite(valeurInitiale?.unite ?? 'u');
    setQuantite(valeurInitiale ? String(valeurInitiale.quantite) : '1');
    setPrixUnitaire(valeurInitiale ? String(valeurInitiale.prixUnitaire) : '0');
    setLigneDevisId(valeurInitiale?.ligneDevisId ?? null);
  }, [visible, valeurInitiale]);

  const q = Number(quantite.replace(',', '.')) || 0;
  const pu = Number(prixUnitaire.replace(',', '.')) || 0;
  const total = q * pu;
  const valide = designation.trim().length > 0;

  const ref = useMemo(() => lignesDevis.find((l) => l.id === ligneDevisId) ?? null, [lignesDevis, ligneDevisId]);
  const dep = evaluerDepassement({ quantite: q, prixUnitaire: pu }, ref);

  const choisirDevis = (id: string) => {
    if (ligneDevisId === id) {
      setLigneDevisId(null);
      return;
    }
    setLigneDevisId(id);
    const l = lignesDevis.find((x) => x.id === id);
    if (l && !valeurInitiale) {
      setDesignation((d) => d || l.designation);
      setUnite(l.unite);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <ScrollView>
            <Text style={styles.titre}>{valeurInitiale ? 'Modifier la ligne' : 'Nouvelle ligne d\'achat'}</Text>

            <Text style={styles.label}>Désignation *</Text>
            <TextInput style={styles.champ} value={designation} onChangeText={setDesignation} placeholder="Article / matériau" autoFocus />

            <View style={styles.ligne}>
              <View style={styles.moitie}>
                <Text style={styles.label}>Unité</Text>
                <TextInput style={styles.champ} value={unite} onChangeText={setUnite} />
              </View>
              <View style={styles.moitie}>
                <Text style={styles.label}>Quantité</Text>
                <TextInput style={styles.champ} value={quantite} onChangeText={setQuantite} keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.label}>Prix unitaire (DZD)</Text>
            <TextInput style={styles.champ} value={prixUnitaire} onChangeText={setPrixUnitaire} keyboardType="numeric" />

            <Text style={styles.label}>Ligne de devis (contrôle budgétaire)</Text>
            <View style={styles.chips}>
              {lignesDevis.length === 0 ? (
                <Text style={styles.aide}>Aucun devis rattaché au projet.</Text>
              ) : (
                lignesDevis.map((l) => (
                  <Pressable key={l.id} style={[styles.chip, ligneDevisId === l.id && styles.chipActif]} onPress={() => choisirDevis(l.id)}>
                    <Text style={[styles.chipTexte, ligneDevisId === l.id && styles.chipTexteActif]} numberOfLines={1}>
                      {l.designation}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            {ref ? (
              <View style={styles.refBox}>
                <Text style={styles.refTexte}>
                  Réf. devis : {ref.quantite} {ref.unite} × {formaterMontant(ref.prixUnitaire)}
                </Text>
                {dep.depassementQuantite ? <Text style={styles.alerte}>⚠ Quantité supérieure au devis</Text> : null}
                {dep.depassementPrix ? <Text style={styles.alerte}>⚠ Prix unitaire supérieur au devis</Text> : null}
              </View>
            ) : null}

            <Text style={styles.total}>Total ligne : {formaterMontant(total)}</Text>

            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
                <Text style={styles.secondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.bouton, valide ? styles.primaire : styles.desactive]}
                onPress={() => valide && onConfirmer({ designation: designation.trim(), unite: unite.trim() || 'u', quantite: q, prixUnitaire: pu, ligneDevisId })}
                disabled={!valide}
              >
                <Text style={styles.primaireTexte}>Valider</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '88%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond, maxWidth: '100%' },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  refBox: { backgroundColor: couleurs.fond, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.sm },
  refTexte: { color: couleurs.texteSecondaire, fontSize: 13 },
  alerte: { color: couleurs.danger, fontWeight: '700', fontSize: 13, marginTop: 4 },
  total: { marginTop: espacements.md, fontSize: 16, fontWeight: '700', color: couleurs.primaire, textAlign: 'right' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  desactive: { backgroundColor: couleurs.bordure },
  primaireTexte: { color: couleurs.surAccent, fontWeight: '700' },
});
