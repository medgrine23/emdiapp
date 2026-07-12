import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { ModalLigneDevis, SaisieLigne } from '@/components/ModalLigneDevis';
import { useCollection, useDocument } from '@/hooks/useRepository';
import {
  devisRepo,
  LIBELLE_STATUT_DEVIS,
  lignesDevisRepo,
  recalculerDevis,
} from '@/services/devisService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite, LigneDevis } from '@/types/models';
import { formaterDate, formaterMontant } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailDevis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: devis, chargement } = useDocument(devisRepo, id);
  const { item: projet } = useDocument(projetsRepo, devis?.projetId);
  const { items: lignes } = useCollection<LigneDevis>(lignesDevisRepo, { filtre: { devisId: id } });

  const [modalLigne, setModalLigne] = useState(false);
  const [ligneEnEdition, setLigneEnEdition] = useState<LigneDevis | null>(null);
  const [modalAnnul, setModalAnnul] = useState(false);

  if (chargement) return <Centre texte="Chargement…" />;
  if (!devis) return <Centre texte="Devis introuvable." />;

  const actif = devis.etat === EtatEntite.Actif;
  const lignesTriees = [...lignes].sort((a, b) => a.ordre - b.ordre);

  const ouvrirAjout = () => {
    setLigneEnEdition(null);
    setModalLigne(true);
  };
  const ouvrirEdition = (l: LigneDevis) => {
    setLigneEnEdition(l);
    setModalLigne(true);
  };

  const enregistrerLigne = async (saisie: SaisieLigne) => {
    setModalLigne(false);
    const totalLigne = saisie.quantite * saisie.prixUnitaire;
    if (ligneEnEdition) {
      await lignesDevisRepo.modifier(ligneEnEdition.id, { ...saisie, totalLigne }, u);
    } else {
      await lignesDevisRepo.creer(
        { ...saisie, totalLigne, devisId: devis.id, projetId: devis.projetId, ordre: lignes.length + 1 },
        u
      );
    }
    await recalculerDevis(devis.id, u);
  };

  const supprimerLigne = (l: LigneDevis) =>
    Alert.alert('Supprimer la ligne', l.designation, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await lignesDevisRepo.supprimer(l.id, u);
          await recalculerDevis(devis.id, u);
        },
      },
    ]);

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: devis.numero }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.numero}>{devis.numero}</Text>
          <Text style={styles.sous}>
            Projet {projet?.reference ?? '—'} · {formaterDate(devis.date)} · TVA {devis.tauxTVA}%
          </Text>
          <Text style={styles.statut}>{LIBELLE_STATUT_DEVIS[devis.statut]}</Text>
        </View>
        <BadgeEtat etat={devis.etat} />
      </View>

      {devis.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulé</Text>
          <Text style={styles.encartTexte}>Motif : {devis.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Lignes ({lignesTriees.length})</Text>
        {actif ? (
          <Pressable onPress={ouvrirAjout}>
            <Text style={styles.ajouter}>+ Ajouter</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.carte}>
        {lignesTriees.length === 0 ? (
          <Text style={styles.videLignes}>Aucune ligne.</Text>
        ) : (
          lignesTriees.map((l) => (
            <Pressable
              key={l.id}
              style={styles.ligne}
              onPress={() => actif && ouvrirEdition(l)}
              onLongPress={() => actif && supprimerLigne(l)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ligneDesignation}>{l.designation}</Text>
                <Text style={styles.ligneDetail}>
                  {l.quantite} {l.unite} × {formaterMontant(l.prixUnitaire)}
                </Text>
              </View>
              <Text style={styles.ligneTotal}>{formaterMontant(l.totalLigne)}</Text>
            </Pressable>
          ))
        )}
      </View>
      {actif && lignesTriees.length > 0 ? (
        <Text style={styles.astuce}>Appui : modifier · Appui long : supprimer</Text>
      ) : null}

      <View style={styles.totaux}>
        <LigneTotal label="Total HT" valeur={devis.totalHT} />
        <LigneTotal label={`TVA (${devis.tauxTVA}%)`} valeur={devis.totalTVA} />
        <LigneTotal label="Total TTC" valeur={devis.totalTTC} fort />
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/devis/formulaire?id=${devis.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer ce devis en lecture seule ?', () => devisRepo.archiver(devis.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={devis.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer ce devis (soft-delete) ?', () => devisRepo.supprimer(devis.id, u))} />
      </View>

      <ModalLigneDevis
        visible={modalLigne}
        valeurInitiale={ligneEnEdition}
        onAnnuler={() => setModalLigne(false)}
        onConfirmer={enregistrerLigne}
      />
      <ModalAnnulation
        visible={modalAnnul}
        onAnnuler={() => setModalAnnul(false)}
        onConfirmer={(motif) => {
          setModalAnnul(false);
          devisRepo.annuler(devis.id, motif, u).then(() => router.back());
        }}
      />
    </ScrollView>
  );
}

function Centre({ texte }: { texte: string }) {
  return (
    <View style={styles.centre}>
      <Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text>
    </View>
  );
}

function LigneTotal({ label, valeur, fort }: { label: string; valeur: number; fort?: boolean }) {
  return (
    <View style={styles.ligneTotalRow}>
      <Text style={[styles.totalLabel, fort && styles.totalFort]}>{label}</Text>
      <Text style={[styles.totalValeur, fort && styles.totalFort]}>{formaterMontant(valeur)}</Text>
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
  numero: { fontSize: 22, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  statut: { fontSize: 13, color: couleurs.primaireClair, fontWeight: '600', marginTop: 2 },
  encartAnnul: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espacements.lg, marginBottom: espacements.sm },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  ajouter: { color: couleurs.accent, fontWeight: '700', fontSize: 14 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.sm },
  videLignes: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ligneDesignation: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ligneDetail: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  ligneTotal: { fontSize: 15, fontWeight: '700', color: couleurs.texte, marginLeft: espacements.sm },
  astuce: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.xs },
  totaux: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginTop: espacements.md },
  ligneTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: couleurs.texteSecondaire },
  totalValeur: { fontSize: 14, color: couleurs.texte, fontWeight: '600' },
  totalFort: { fontSize: 17, fontWeight: '800', color: couleurs.primaire },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
