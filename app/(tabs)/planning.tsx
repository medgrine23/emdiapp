import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { Carte } from '@/components/Carte';
import { Fab } from '@/components/Fab';
import { GanttChart } from '@/components/GanttChart';
import { useCollection } from '@/hooks/useRepository';
import { COULEUR_STATUT, LIBELLE_STATUT_TACHE, tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterDate } from '@/utils/format';

export default function EcranPlanning() {
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: taches } = useCollection(tachesRepo);
  const [projetId, setProjetId] = useState<string | null>(null);

  const projetActif = projetId ?? projets[0]?.id ?? null;
  const tachesProjet = useMemo(
    () => taches.filter((t) => t.projetId === projetActif).sort((a, b) => a.ordre - b.ordre),
    [taches, projetActif]
  );

  return (
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Projet</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chips}>
            {projets.map((p) => (
              <Pressable key={p.id} style={[styles.chip, projetActif === p.id && styles.chipActif]} onPress={() => setProjetId(p.id)}>
                <Text style={[styles.chipTexte, projetActif === p.id && styles.chipTexteActif]}>{p.reference}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionTitre}>Diagramme de Gantt</Text>
        <GanttChart taches={tachesProjet} onTachePress={(t) => router.push(`/(modules)/planning/${t.id}`)} />

        <Text style={styles.sectionTitre}>Tâches ({tachesProjet.length})</Text>
        {tachesProjet.length === 0 ? (
          <Text style={styles.vide}>Aucune tâche. Appuyez sur + pour en ajouter.</Text>
        ) : (
          tachesProjet.map((t) => (
            <Carte key={t.id} onPress={() => router.push(`/(modules)/planning/${t.id}`)} style={styles.carte}>
              <View style={styles.ligneHaut}>
                <View style={[styles.pastille, { backgroundColor: COULEUR_STATUT[t.statut] }]} />
                <Text style={styles.nom}>{t.nom}</Text>
                <BadgeEtat etat={t.etat} />
              </View>
              <Text style={styles.meta}>
                {formaterDate(t.dateDebut)} → {formaterDate(t.dateFin)} · {LIBELLE_STATUT_TACHE[t.statut]} · {t.avancementPct}%
              </Text>
            </Carte>
          ))
        )}
      </ScrollView>

      <Fab onPress={() => projetActif && router.push(`/(modules)/planning/formulaire?projetId=${projetActif}`)} disabled={!projetActif} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: 90 },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginBottom: espacements.xs },
  chipsScroll: { marginBottom: espacements.sm },
  chips: { flexDirection: 'row', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  sectionTitre: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, color: couleurs.texteSecondaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.md },
  carte: { marginBottom: espacements.sm, padding: espacements.md },
  ligneHaut: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm },
  pastille: { width: 10, height: 10, borderRadius: 5 },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte, flex: 1 },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: espacements.xs },
});
