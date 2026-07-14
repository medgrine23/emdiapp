import { useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { ModalDependance, SaisieDependance } from '@/components/ModalDependance';
import { useCollection, useDocument } from '@/hooks/useRepository';
import { lignesDevisRepo } from '@/services/devisService';
import {
  COULEUR_STATUT,
  dependancesRepo,
  LIBELLE_STATUT_TACHE,
  LIBELLE_TYPE_DEPENDANCE,
  tachesRepo,
} from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';
import { formaterDate } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailTache() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: tache, chargement } = useDocument(tachesRepo, id);
  const { item: projet } = useDocument(projetsRepo, tache?.projetId);
  const { item: ligneDevis } = useDocument(lignesDevisRepo, tache?.ligneDevisId ?? undefined);
  const { items: toutesTaches } = useCollection(tachesRepo, { filtre: { projetId: tache?.projetId } });
  const { items: dependances } = useCollection(dependancesRepo, { filtre: { tacheSuccesseurId: id } });

  const [modalDep, setModalDep] = useState(false);
  const [modalAnnul, setModalAnnul] = useState(false);

  const nomTache = (tid: string) => toutesTaches.find((t) => t.id === tid)?.nom ?? '—';
  const predecesseursPossibles = useMemo(
    () => toutesTaches.filter((t) => t.id !== id && !dependances.some((d) => d.tachePredecesseurId === t.id)),
    [toutesTaches, dependances, id]
  );

  if (chargement) return <Centre texte="Chargement…" />;
  if (!tache) return <Centre texte="Tâche introuvable." />;

  const actif = tache.etat === EtatEntite.Actif;

  const ajouterDependance = async (d: SaisieDependance) => {
    setModalDep(false);
    await dependancesRepo.creer({ ...d, tacheSuccesseurId: tache.id, projetId: tache.projetId }, u);
  };
  const supprimerDependance = (depId: string, libelle: string) =>
    Alert.alert('Supprimer la dépendance', libelle, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => dependancesRepo.supprimer(depId, u) },
    ]);

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: tache.nom }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <View style={styles.titreLigne}>
            <View style={[styles.pastille, { backgroundColor: COULEUR_STATUT[tache.statut] }]} />
            <Text style={styles.nom}>{tache.nom}</Text>
          </View>
          <Text style={styles.sous}>Projet {projet?.reference ?? '—'}</Text>
        </View>
        <BadgeEtat etat={tache.etat} />
      </View>

      {tache.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulée</Text>
          <Text style={styles.encartTexte}>Motif : {tache.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.carte}>
        <Champ label="Début" valeur={formaterDate(tache.dateDebut)} />
        <Champ label="Fin" valeur={formaterDate(tache.dateFin)} />
        <Champ label="Durée" valeur={`${tache.dureeJours} j`} />
        <Champ label="Statut" valeur={LIBELLE_STATUT_TACHE[tache.statut]} />
        <Champ label="Avancement" valeur={`${tache.avancementPct} %`} />
        {ligneDevis ? <Champ label="Ligne de devis" valeur={ligneDevis.designation} /> : null}
      </View>

      <View style={styles.avancementBarre}>
        <View style={[styles.avancementFill, { width: `${Math.min(100, tache.avancementPct)}%`, backgroundColor: COULEUR_STATUT[tache.statut] }]} />
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Dépendances ({dependances.length})</Text>
        {actif ? <Pressable onPress={() => setModalDep(true)}><Text style={styles.ajouter}>+ Ajouter</Text></Pressable> : null}
      </View>
      <View style={styles.carte}>
        {dependances.length === 0 ? (
          <Text style={styles.videSection}>Aucune dépendance.</Text>
        ) : (
          dependances.map((d) => (
            <Pressable
              key={d.id}
              style={styles.ligne}
              onLongPress={() => actif && supprimerDependance(d.id, nomTache(d.tachePredecesseurId))}
            >
              <Text style={styles.ligneDesignation}>{nomTache(d.tachePredecesseurId)}</Text>
              <Text style={styles.ligneDetail}>
                {LIBELLE_TYPE_DEPENDANCE[d.type]}{d.decalageJours ? ` · ${d.decalageJours > 0 ? '+' : ''}${d.decalageJours} j` : ''}
              </Text>
            </Pressable>
          ))
        )}
      </View>
      {actif && dependances.length > 0 ? <Text style={styles.astuce}>Appui long : supprimer une dépendance</Text> : null}

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/planning/formulaire?id=${tache.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer cette tâche en lecture seule ?', () => tachesRepo.archiver(tache.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={tache.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer cette tâche (soft-delete) ?', () => tachesRepo.supprimer(tache.id, u))} />
      </View>

      <ModalDependance visible={modalDep} predecesseursPossibles={predecesseursPossibles} onAnnuler={() => setModalDep(false)} onConfirmer={ajouterDependance} />
      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); tachesRepo.annuler(tache.id, motif, u).then(() => router.back()); }} />
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
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm },
  pastille: { width: 12, height: 12, borderRadius: 6 },
  nom: { fontSize: 20, fontWeight: '700', color: couleurs.texte, flex: 1 },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  encartAnnul: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginTop: espacements.md },
  champ: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  champLabel: { color: couleurs.texteSecondaire, fontSize: 14 },
  champValeur: { color: couleurs.texte, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  avancementBarre: { height: 10, backgroundColor: couleurs.bordure, borderRadius: 5, marginTop: espacements.sm, overflow: 'hidden' },
  avancementFill: { height: '100%', borderRadius: 5 },
  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espacements.lg, marginBottom: espacements.sm },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  ajouter: { color: couleurs.primaireClair, fontWeight: '700', fontSize: 14 },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ligneDesignation: { fontSize: 15, color: couleurs.texte, fontWeight: '600', flex: 1 },
  ligneDetail: { fontSize: 13, color: couleurs.texteSecondaire, marginLeft: espacements.sm },
  astuce: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
