import { useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { ModalRapportTache, SaisieRapportTache } from '@/components/ModalRapportTache';
import { useCollection, useDocument } from '@/hooks/useRepository';
import { tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import {
  appliquerAvancementTache,
  LIBELLE_TYPE_RAPPORT,
  rapportsRepo,
  rapportsTacheRepo,
} from '@/services/rapportService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';
import { formaterDate } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailRapport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: rapport, chargement } = useDocument(rapportsRepo, id);
  const { item: projet } = useDocument(projetsRepo, rapport?.projetId);
  const { items: lignes } = useCollection(rapportsTacheRepo, { filtre: { rapportId: id } });
  const { items: taches } = useCollection(tachesRepo, { filtre: { projetId: rapport?.projetId } });

  const [modalTache, setModalTache] = useState(false);
  const [modalAnnul, setModalAnnul] = useState(false);

  const nomTache = (tid: string) => taches.find((t) => t.id === tid)?.nom ?? '—';
  const tachesDisponibles = useMemo(
    () => taches.filter((t) => t.etat === EtatEntite.Actif && !lignes.some((l) => l.tachePlanningId === t.id)),
    [taches, lignes]
  );

  if (chargement) return <Centre texte="Chargement…" />;
  if (!rapport) return <Centre texte="Rapport introuvable." />;

  const actif = rapport.etat === EtatEntite.Actif;

  const ajouterLigne = async (saisie: SaisieRapportTache) => {
    setModalTache(false);
    await rapportsTacheRepo.creer({ ...saisie, rapportId: rapport.id, projetId: rapport.projetId }, u);
    // Propagation de l'avancement vers la tâche du planning (§3.6).
    await appliquerAvancementTache(saisie.tachePlanningId, saisie.avancementPct, u);
  };

  const supprimerLigne = (ligneId: string, libelle: string) =>
    Alert.alert('Supprimer la ligne', libelle, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => rapportsTacheRepo.supprimer(ligneId, u) },
    ]);

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: LIBELLE_TYPE_RAPPORT[rapport.type] }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titre}>Rapport {LIBELLE_TYPE_RAPPORT[rapport.type].toLowerCase()}</Text>
          <Text style={styles.sous}>{formaterDate(rapport.date)} · Projet {projet?.reference ?? '—'}</Text>
        </View>
        <BadgeEtat etat={rapport.etat} />
      </View>

      {rapport.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulé</Text>
          <Text style={styles.encartTexte}>Motif : {rapport.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.carte}>
        {rapport.meteo ? (
          <Champ label="Météo" valeur={`${rapport.meteo.condition}${rapport.meteo.temperatureC != null ? ` · ${rapport.meteo.temperatureC}°C` : ''}${rapport.meteo.intemperie ? ' · ⚠ intempérie' : ''}`} />
        ) : null}
        <Champ label="Effectif présent" valeur={`${rapport.effectifPresent}`} />
        {rapport.avancementGlobalPct != null ? <Champ label="Avancement global" valeur={`${rapport.avancementGlobalPct} %`} /> : null}
        {rapport.remarques ? <Champ label="Remarques" valeur={rapport.remarques} /> : null}
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Avancement des tâches ({lignes.length})</Text>
        {actif ? <Pressable onPress={() => setModalTache(true)}><Text style={styles.ajouter}>+ Ajouter</Text></Pressable> : null}
      </View>
      <Text style={styles.info}>Les avancements saisis ici mettent à jour le Planning.</Text>
      <View style={styles.carte}>
        {lignes.length === 0 ? (
          <Text style={styles.videSection}>Aucun avancement saisi.</Text>
        ) : (
          lignes.map((l) => (
            <Pressable key={l.id} style={styles.ligne} onLongPress={() => actif && supprimerLigne(l.id, nomTache(l.tachePlanningId))}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ligneDesignation}>{nomTache(l.tachePlanningId)}</Text>
                {l.commentaire ? <Text style={styles.ligneDetail}>{l.commentaire}</Text> : null}
              </View>
              <Text style={styles.lignePct}>{l.avancementPct}%</Text>
            </Pressable>
          ))
        )}
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/rapports/formulaire?id=${rapport.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer ce rapport en lecture seule ?', () => rapportsRepo.archiver(rapport.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={rapport.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer ce rapport (soft-delete) ?', () => rapportsRepo.supprimer(rapport.id, u))} />
      </View>

      <ModalRapportTache visible={modalTache} taches={tachesDisponibles} onAnnuler={() => setModalTache(false)} onConfirmer={ajouterLigne} />
      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); rapportsRepo.annuler(rapport.id, motif, u).then(() => router.back()); }} />
    </ScrollView>
  );
}

function Centre({ texte }: { texte: string }) {
  return <View style={styles.centre}><Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text></View>;
}
function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.champ}>
      <Text style={styles.champLabel}>{label}</Text>
      <Text style={styles.champValeur}>{valeur}</Text>
    </View>
  );
}
function Bouton({ label, couleur, onPress, desactive }: { label: string; couleur: string; onPress: () => void; desactive?: boolean }) {
  return (
    <Pressable style={[styles.bouton, { borderColor: couleur }, desactive && styles.boutonDesactive]} onPress={onPress} disabled={desactive}>
      <Text style={[styles.boutonTexte, { color: desactive ? couleurs.bordure : couleur }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond },
  enTete: { flexDirection: 'row', alignItems: 'flex-start' },
  titre: { fontSize: 20, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  encartAnnul: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginTop: espacements.md },
  champ: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  champLabel: { color: couleurs.texteSecondaire, fontSize: 14 },
  champValeur: { color: couleurs.texte, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: espacements.md },
  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espacements.lg },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  info: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginBottom: espacements.sm },
  ajouter: { color: couleurs.primaireClair, fontWeight: '700', fontSize: 14 },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ligneDesignation: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ligneDetail: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  lignePct: { fontSize: 15, fontWeight: '700', color: couleurs.primaire, marginLeft: espacements.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
