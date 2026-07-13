/**
 * Diagramme de Gantt simplifié, adapté au mobile (livrable 2 du CDC).
 *
 * Axe temporel horizontal scrollable : chaque tâche est une barre positionnée
 * selon sa date de début et sa durée, colorée selon son statut, avec un
 * remplissage proportionnel à l'avancement. Un appui sur une barre ouvre la tâche.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COULEUR_STATUT, joursEntre, plagePlanning } from '@/services/planningService';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { TachePlanning } from '@/types/models';

const LARGEUR_JOUR = 20; // px par jour
const HAUTEUR_LIGNE = 44;

export function GanttChart({
  taches,
  onTachePress,
}: {
  taches: TachePlanning[];
  onTachePress?: (t: TachePlanning) => void;
}) {
  const plage = plagePlanning(taches);
  if (!plage) {
    return <Text style={styles.vide}>Aucune tâche à afficher sur le diagramme.</Text>;
  }

  const largeurTotale = plage.totalJours * LARGEUR_JOUR;
  const tachesTriees = [...taches].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

  // Graduations hebdomadaires.
  const semaines: { offset: number; label: string }[] = [];
  for (let j = 0; j < plage.totalJours; j += 7) {
    const d = new Date(new Date(plage.debut).getTime() + j * 86400000);
    semaines.push({ offset: j * LARGEUR_JOUR, label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) });
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.conteneur}>
      <View style={{ width: largeurTotale }}>
        {/* Axe des dates */}
        <View style={styles.axe}>
          {semaines.map((s) => (
            <View key={s.offset} style={[styles.graduation, { left: s.offset }]}>
              <Text style={styles.graduationTexte}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Lignes / barres */}
        {tachesTriees.map((t) => {
          const gauche = joursEntre(plage.debut, t.dateDebut) * LARGEUR_JOUR;
          const largeur = Math.max(LARGEUR_JOUR, t.dureeJours * LARGEUR_JOUR);
          const couleur = COULEUR_STATUT[t.statut];
          return (
            <View key={t.id} style={styles.ligne}>
              <View
                style={[styles.barre, { left: gauche, width: largeur, backgroundColor: `${couleur}33`, borderColor: couleur }]}
                onStartShouldSetResponder={() => true}
                onResponderRelease={() => onTachePress?.(t)}
              >
                <View style={[styles.remplissage, { width: `${Math.min(100, t.avancementPct)}%`, backgroundColor: couleur }]} />
                <Text style={styles.barreTexte} numberOfLines={1}>
                  {t.nom} · {t.avancementPct}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure },
  vide: { color: couleurs.texteSecondaire, padding: espacements.md, textAlign: 'center' },
  axe: { height: 24, borderBottomWidth: 1, borderBottomColor: couleurs.bordure },
  graduation: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderLeftColor: couleurs.bordure, paddingLeft: 2, justifyContent: 'center' },
  graduationTexte: { fontSize: 10, color: couleurs.texteSecondaire },
  ligne: { height: HAUTEUR_LIGNE, justifyContent: 'center' },
  barre: { position: 'absolute', height: 28, borderRadius: rayons.sm, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  remplissage: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.5 },
  barreTexte: { fontSize: 11, fontWeight: '700', color: couleurs.texte, paddingHorizontal: 6 },
});
