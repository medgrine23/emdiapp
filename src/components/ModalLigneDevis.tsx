/** Modale de saisie/édition d'une ligne de devis. La quantité peut être saisie
 *  manuellement ou tirée du métré (une pièce et l'une de ses métriques). */
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LIBELLE_METRIQUE, UNITE_METRIQUE, valeurMetrique } from '@/services/quantitatifService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Piece, TypeMetrique } from '@/types/models';
import { formaterMontant } from '@/utils/format';

const METRIQUES: TypeMetrique[] = ['surface_murs', 'surface_sol', 'volume'];

export interface SaisieLigne {
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  pieceId?: string | null;
  metrique?: TypeMetrique | null;
}

export function ModalLigneDevis({
  visible,
  valeurInitiale,
  pieces = [],
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  valeurInitiale?: SaisieLigne | null;
  pieces?: Piece[];
  onAnnuler: () => void;
  onConfirmer: (ligne: SaisieLigne) => void;
}) {
  const [designation, setDesignation] = useState('');
  const [unite, setUnite] = useState('u');
  const [quantite, setQuantite] = useState('1');
  const [prixUnitaire, setPrixUnitaire] = useState('0');
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [metrique, setMetrique] = useState<TypeMetrique | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDesignation(valeurInitiale?.designation ?? '');
    setUnite(valeurInitiale?.unite ?? 'u');
    setQuantite(valeurInitiale ? String(valeurInitiale.quantite) : '1');
    setPrixUnitaire(valeurInitiale ? String(valeurInitiale.prixUnitaire) : '0');
    setPieceId(valeurInitiale?.pieceId ?? null);
    setMetrique(valeurInitiale?.metrique ?? null);
  }, [visible, valeurInitiale]);

  const appliquerMetre = (pid: string, m: TypeMetrique) => {
    const piece = pieces.find((p) => p.id === pid);
    if (!piece) return;
    setPieceId(pid);
    setMetrique(m);
    setQuantite(String(valeurMetrique(piece, m)));
    setUnite(UNITE_METRIQUE[m]);
    if (!designation.trim()) setDesignation(`${LIBELLE_METRIQUE[m]} — ${piece.nom}`);
  };

  const detacherMetre = () => {
    setPieceId(null);
    setMetrique(null);
  };

  const q = Number(quantite.replace(',', '.')) || 0;
  const pu = Number(prixUnitaire.replace(',', '.')) || 0;
  const total = q * pu;
  const valide = designation.trim().length > 0;

  const confirmer = () => {
    if (!valide) return;
    onConfirmer({ designation: designation.trim(), unite: unite.trim() || 'u', quantite: q, prixUnitaire: pu, pieceId, metrique });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <ScrollView>
            <Text style={styles.titre}>{valeurInitiale ? 'Modifier la ligne' : 'Nouvelle ligne'}</Text>

            <Text style={styles.label}>Désignation *</Text>
            <TextInput style={styles.champ} value={designation} onChangeText={setDesignation} placeholder="Désignation de la prestation" />

            {pieces.length > 0 ? (
              <View style={styles.metreBox}>
                <View style={styles.metreEntete}>
                  <Text style={styles.metreTitre}>Quantité depuis le métré</Text>
                  {pieceId ? <Pressable onPress={detacherMetre}><Text style={styles.detacher}>Saisie manuelle</Text></Pressable> : null}
                </View>
                <Text style={styles.metreSous}>Choisissez une pièce puis une métrique.</Text>
                <View style={styles.chips}>
                  {pieces.map((p) => (
                    <Pressable key={p.id} style={[styles.chip, pieceId === p.id && styles.chipActif]} onPress={() => appliquerMetre(p.id, metrique ?? 'surface_murs')}>
                      <Text style={[styles.chipTexte, pieceId === p.id && styles.chipTexteActif]}>{p.nom}</Text>
                    </Pressable>
                  ))}
                </View>
                {pieceId ? (
                  <View style={styles.chips}>
                    {METRIQUES.map((m) => (
                      <Pressable key={m} style={[styles.chip, metrique === m && styles.chipActif]} onPress={() => appliquerMetre(pieceId, m)}>
                        <Text style={[styles.chipTexte, metrique === m && styles.chipTexteActif]}>{LIBELLE_METRIQUE[m]}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.ligne}>
              <View style={styles.moitie}>
                <Text style={styles.label}>Unité</Text>
                <TextInput style={styles.champ} value={unite} onChangeText={setUnite} placeholder="u, m², ml…" />
              </View>
              <View style={styles.moitie}>
                <Text style={styles.label}>Quantité{pieceId ? ' (métré)' : ''}</Text>
                <TextInput style={[styles.champ, pieceId ? styles.champVerrou : null]} value={quantite} onChangeText={setQuantite} keyboardType="numeric" editable={!pieceId} />
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '90%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  champVerrou: { backgroundColor: couleurs.surface2, color: couleurs.texteSecondaire },
  metreBox: { marginTop: espacements.md, backgroundColor: couleurs.surface2, borderRadius: rayons.sm, padding: espacements.sm, borderWidth: 1, borderColor: couleurs.bordure },
  metreEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metreTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire },
  metreSous: { fontSize: 12, color: couleurs.texteSecondaire, marginTop: 2, marginBottom: espacements.sm },
  detacher: { color: couleurs.accent, fontWeight: '700', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginBottom: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 5, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 12 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
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
