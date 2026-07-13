/**
 * Modale d'ajout d'une ligne d'avancement au rapport : choix d'une tâche du
 * planning + pourcentage d'avancement (qui sera propagé à la tâche) + commentaire.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { couleurs, espacements, rayons } from '@/theme/theme';
import { TachePlanning } from '@/types/models';

export interface SaisieRapportTache {
  tachePlanningId: string;
  avancementPct: number;
  commentaire?: string;
}

export function ModalRapportTache({
  visible,
  taches,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  taches: TachePlanning[];
  onAnnuler: () => void;
  onConfirmer: (r: SaisieRapportTache) => void;
}) {
  const [tacheId, setTacheId] = useState<string | null>(null);
  const [avancement, setAvancement] = useState('0');
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTacheId(null);
    setAvancement('0');
    setCommentaire('');
  }, [visible]);

  const choisir = (id: string) => {
    setTacheId(id);
    const t = taches.find((x) => x.id === id);
    if (t) setAvancement(String(t.avancementPct));
  };

  const valide = Boolean(tacheId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <ScrollView>
            <Text style={styles.titre}>Avancement d'une tâche</Text>

            <Text style={styles.label}>Tâche *</Text>
            <View style={styles.chips}>
              {taches.length === 0 ? (
                <Text style={styles.aide}>Aucune tâche de planning pour ce projet.</Text>
              ) : (
                taches.map((t) => (
                  <Pressable key={t.id} style={[styles.chip, tacheId === t.id && styles.chipActif]} onPress={() => choisir(t.id)}>
                    <Text style={[styles.chipTexte, tacheId === t.id && styles.chipTexteActif]} numberOfLines={1}>{t.nom}</Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.label}>Avancement (%)</Text>
            <TextInput style={styles.champ} value={avancement} onChangeText={setAvancement} keyboardType="numeric" />

            <Text style={styles.label}>Commentaire</Text>
            <TextInput style={[styles.champ, styles.multi]} value={commentaire} onChangeText={setCommentaire} multiline />

            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={onAnnuler}>
                <Text style={styles.secondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.bouton, valide ? styles.primaire : styles.desactive]}
                onPress={() =>
                  valide &&
                  tacheId &&
                  onConfirmer({
                    tachePlanningId: tacheId,
                    avancementPct: Math.max(0, Math.min(100, Number(avancement.replace(',', '.')) || 0)),
                    commentaire: commentaire.trim() || undefined,
                  })
                }
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
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '85%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  multi: { minHeight: 60, textAlignVertical: 'top' },
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
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
