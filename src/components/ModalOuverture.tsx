/**
 * Modale d'ajout d'une ouverture (porte/fenêtre) à une pièce : choix dans la
 * nomenclature (catalogue) ou saisie personnalisée, avec quantité.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { catalogueRepo } from '@/services/quantitatifService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { OuverturePiece } from '@/types/models';

export function ModalOuverture({
  visible,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  onAnnuler: () => void;
  onConfirmer: (o: OuverturePiece) => void;
}) {
  const { items: catalogue } = useCollection(catalogueRepo);
  const [nom, setNom] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [quantite, setQuantite] = useState('1');
  const [choixId, setChoixId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNom('');
    setLargeur('');
    setHauteur('');
    setQuantite('1');
    setChoixId(null);
  }, [visible]);

  const choisir = (id: string) => {
    const c = catalogue.find((x) => x.id === id);
    if (!c) return;
    setChoixId(id);
    setNom(c.nom);
    setLargeur(String(c.largeur));
    setHauteur(String(c.hauteur));
  };

  const l = Number(largeur.replace(',', '.')) || 0;
  const h = Number(hauteur.replace(',', '.')) || 0;
  const q = Number(quantite.replace(',', '.')) || 0;
  const valide = nom.trim().length > 0 && l > 0 && h > 0 && q > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <ScrollView>
            <Text style={styles.titre}>Ajouter une ouverture</Text>

            <Text style={styles.label}>Depuis la nomenclature</Text>
            <View style={styles.chips}>
              {catalogue.length === 0 ? (
                <Text style={styles.aide}>Aucun élément (à créer dans « Nomenclature »).</Text>
              ) : (
                catalogue.map((c) => (
                  <Pressable key={c.id} style={[styles.chip, choixId === c.id && styles.chipActif]} onPress={() => choisir(c.id)}>
                    <Text style={[styles.chipTexte, choixId === c.id && styles.chipTexteActif]}>
                      {c.nom} ({c.largeur}×{c.hauteur})
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.label}>Désignation *</Text>
            <TextInput style={styles.champ} value={nom} onChangeText={(v) => { setNom(v); setChoixId(null); }} placeholder="Porte, fenêtre…" />

            <View style={styles.ligne}>
              <View style={styles.tiers}><Text style={styles.label}>Largeur (m)</Text><TextInput style={styles.champ} value={largeur} onChangeText={setLargeur} keyboardType="numeric" /></View>
              <View style={styles.tiers}><Text style={styles.label}>Hauteur (m)</Text><TextInput style={styles.champ} value={hauteur} onChangeText={setHauteur} keyboardType="numeric" /></View>
              <View style={styles.tiers}><Text style={styles.label}>Nombre</Text><TextInput style={styles.champ} value={quantite} onChangeText={setQuantite} keyboardType="numeric" /></View>
            </View>

            <Text style={styles.total}>Déduction : {(l * h * q).toFixed(2)} m²</Text>

            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}><Text style={styles.secondaireTexte}>Annuler</Text></Pressable>
              <Pressable
                style={[styles.bouton, valide ? styles.primaire : styles.desactive]}
                onPress={() => valide && onConfirmer({ nom: nom.trim(), largeur: l, hauteur: h, quantite: q })}
                disabled={!valide}
              >
                <Text style={styles.primaireTexte}>Ajouter</Text>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  tiers: { flex: 1 },
  total: { marginTop: espacements.md, fontSize: 15, fontWeight: '700', color: couleurs.primaire, textAlign: 'right' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  desactive: { backgroundColor: couleurs.bordure },
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
