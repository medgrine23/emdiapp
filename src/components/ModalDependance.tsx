/** Modale d'ajout d'une dépendance : tâche prédécesseur + type + décalage. */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LIBELLE_TYPE_DEPENDANCE } from '@/services/planningService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { TachePlanning, TypeDependance } from '@/types/models';

const TYPES = Object.keys(LIBELLE_TYPE_DEPENDANCE) as TypeDependance[];

export interface SaisieDependance {
  tachePredecesseurId: string;
  type: TypeDependance;
  decalageJours: number;
}

export function ModalDependance({
  visible,
  predecesseursPossibles,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  predecesseursPossibles: TachePlanning[];
  onAnnuler: () => void;
  onConfirmer: (d: SaisieDependance) => void;
}) {
  const [predId, setPredId] = useState<string | null>(null);
  const [type, setType] = useState<TypeDependance>('FD');
  const [decalage, setDecalage] = useState('0');

  useEffect(() => {
    if (!visible) return;
    setPredId(null);
    setType('FD');
    setDecalage('0');
  }, [visible]);

  const valide = Boolean(predId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <ScrollView>
            <Text style={styles.titre}>Ajouter une dépendance</Text>

            <Text style={styles.label}>Tâche prédécesseur *</Text>
            <View style={styles.chips}>
              {predecesseursPossibles.length === 0 ? (
                <Text style={styles.aide}>Aucune autre tâche disponible.</Text>
              ) : (
                predecesseursPossibles.map((t) => (
                  <Pressable key={t.id} style={[styles.chip, predId === t.id && styles.chipActif]} onPress={() => setPredId(t.id)}>
                    <Text style={[styles.chipTexte, predId === t.id && styles.chipTexteActif]} numberOfLines={1}>{t.nom}</Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {TYPES.map((tp) => (
                <Pressable key={tp} style={[styles.chip, type === tp && styles.chipActif]} onPress={() => setType(tp)}>
                  <Text style={[styles.chipTexte, type === tp && styles.chipTexteActif]}>{LIBELLE_TYPE_DEPENDANCE[tp]}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Décalage (jours)</Text>
            <TextInput style={styles.champ} value={decalage} onChangeText={setDecalage} keyboardType="numbers-and-punctuation" />

            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
                <Text style={styles.secondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.bouton, valide ? styles.primaire : styles.desactive]}
                onPress={() => valide && predId && onConfirmer({ tachePredecesseurId: predId, type, decalageJours: Number(decalage.replace(',', '.')) || 0 })}
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
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '85%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond, maxWidth: '100%' },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  desactive: { backgroundColor: couleurs.bordure },
  primaireTexte: { color: couleurs.surAccent, fontWeight: '700' },
});
