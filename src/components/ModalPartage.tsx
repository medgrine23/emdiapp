/**
 * Modale de partage métier dans une conversation (§3.9) : choisir une catégorie
 * (tâche, ligne de devis, rapport, document) puis l'élément à partager.
 */
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { documentsRepo } from '@/services/documentService';
import { devisRepo, lignesDevisRepo } from '@/services/devisService';
import { LIBELLE_ENTITE_PARTAGEE } from '@/services/chatService';
import { tachesRepo } from '@/services/planningService';
import { LIBELLE_TYPE_RAPPORT, rapportsRepo } from '@/services/rapportService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EntitePartagee, PartageMetier } from '@/types/models';
import { formaterDate } from '@/utils/format';

const CATEGORIES: EntitePartagee[] = ['tache_planning', 'ligne_devis', 'rapport', 'document'];

export function ModalPartage({
  visible,
  projetId,
  onAnnuler,
  onConfirmer,
}: {
  visible: boolean;
  projetId?: string | null;
  onAnnuler: () => void;
  onConfirmer: (p: PartageMetier) => void;
}) {
  const [categorie, setCategorie] = useState<EntitePartagee>('tache_planning');
  const { items: taches } = useCollection(tachesRepo);
  const { items: lignesDevis } = useCollection(lignesDevisRepo);
  const { items: devis } = useCollection(devisRepo);
  const { items: rapports } = useCollection(rapportsRepo);
  const { items: documents } = useCollection(documentsRepo);

  const parProjet = <T extends { projetId?: string | null }>(arr: T[]) =>
    projetId ? arr.filter((x) => x.projetId === projetId) : arr;

  const elements = useMemo(() => {
    switch (categorie) {
      case 'tache_planning':
        return parProjet(taches).map((t) => ({ id: t.id, apercu: t.nom }));
      case 'ligne_devis':
        return parProjet(lignesDevis).map((l) => {
          const num = devis.find((d) => d.id === l.devisId)?.numero;
          return { id: l.id, apercu: `${l.designation}${num ? ` (${num})` : ''}` };
        });
      case 'rapport':
        return parProjet(rapports).map((r) => ({ id: r.id, apercu: `Rapport ${LIBELLE_TYPE_RAPPORT[r.type].toLowerCase()} · ${formaterDate(r.date)}` }));
      case 'document':
        return parProjet(documents).map((d) => ({ id: d.id, apercu: d.nom }));
      default:
        return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorie, taches, lignesDevis, devis, rapports, documents, projetId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onAnnuler}>
      <View style={styles.overlay}>
        <View style={styles.boite}>
          <Text style={styles.titre}>Partager dans la conversation</Text>

          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} style={[styles.chip, categorie === c && styles.chipActif]} onPress={() => setCategorie(c)}>
                <Text style={[styles.chipTexte, categorie === c && styles.chipTexteActif]}>{LIBELLE_ENTITE_PARTAGEE[c]}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.liste}>
            {elements.length === 0 ? (
              <Text style={styles.vide}>Aucun élément à partager.</Text>
            ) : (
              elements.map((e) => (
                <Pressable
                  key={e.id}
                  style={styles.element}
                  onPress={() => onConfirmer({ entiteType: categorie, entiteId: e.id, apercu: e.apercu })}
                >
                  <Text style={styles.elementTexte}>{e.apercu}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          <Pressable style={styles.annuler} onPress={onAnnuler}>
            <Text style={styles.annulerTexte}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '80%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginBottom: espacements.sm },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  liste: { maxHeight: 320 },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', padding: espacements.md },
  element: { paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  elementTexte: { fontSize: 15, color: couleurs.texte },
  annuler: { alignItems: 'center', paddingVertical: espacements.md, marginTop: espacements.sm },
  annulerTexte: { color: couleurs.texteSecondaire, fontWeight: '600' },
});
