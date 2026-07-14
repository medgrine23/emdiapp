import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { ModalLigneDevis, SaisieLigne } from '@/components/ModalLigneDevis';
import { ModalPaiement, SaisiePaiement } from '@/components/ModalPaiement';
import { useCollection, useDocument } from '@/hooks/useRepository';
import {
  facturesRepo,
  LIBELLE_MODE_PAIEMENT,
  LIBELLE_STATUT_FACTURE,
  LIBELLE_TYPE_FACTURE,
  lignesFactureRepo,
  paiementsRepo,
  recalculerFacture,
  recalculerPaiements,
  relancesRepo,
  resteAPayer,
} from '@/services/factureService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite, LigneFacture, Paiement, Relance } from '@/types/models';
import { formaterDate, formaterMontant } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailFacture() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: facture, chargement } = useDocument(facturesRepo, id);
  const { item: projet } = useDocument(projetsRepo, facture?.projetId);
  const { items: lignes } = useCollection<LigneFacture>(lignesFactureRepo, { filtre: { factureId: id } });
  const { items: paiements } = useCollection<Paiement>(paiementsRepo, { filtre: { factureId: id } });
  const { items: relances } = useCollection<Relance>(relancesRepo, { filtre: { factureId: id } });

  const [modalLigne, setModalLigne] = useState(false);
  const [ligneEnEdition, setLigneEnEdition] = useState<LigneFacture | null>(null);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [modalAnnul, setModalAnnul] = useState(false);

  if (chargement) return <Centre texte="Chargement…" />;
  if (!facture) return <Centre texte="Facture introuvable." />;

  const actif = facture.etat === EtatEntite.Actif;
  const reste = resteAPayer(facture);

  const enregistrerLigne = async (saisie: SaisieLigne) => {
    setModalLigne(false);
    const totalLigne = saisie.quantite * saisie.prixUnitaire;
    if (ligneEnEdition) {
      await lignesFactureRepo.modifier(ligneEnEdition.id, { ...saisie, totalLigne }, u);
    } else {
      await lignesFactureRepo.creer({ ...saisie, totalLigne, factureId: facture.id, projetId: facture.projetId }, u);
    }
    await recalculerFacture(facture.id, u);
    await recalculerPaiements(facture.id, u);
  };

  const supprimerLigne = (l: LigneFacture) =>
    Alert.alert('Supprimer la ligne', l.designation, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await lignesFactureRepo.supprimer(l.id, u);
          await recalculerFacture(facture.id, u);
          await recalculerPaiements(facture.id, u);
        },
      },
    ]);

  const enregistrerPaiement = async (p: SaisiePaiement) => {
    setModalPaiement(false);
    await paiementsRepo.creer({ ...p, factureId: facture.id, projetId: facture.projetId, date: new Date().toISOString() }, u);
    await recalculerPaiements(facture.id, u);
  };

  const supprimerPaiement = (p: Paiement) =>
    Alert.alert('Supprimer le paiement', formaterMontant(p.montant), [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await paiementsRepo.supprimer(p.id, u);
          await recalculerPaiements(facture.id, u);
        },
      },
    ]);

  const ajouterRelance = () => {
    const niveau = relances.length + 1;
    Alert.alert(`Relance niveau ${niveau}`, 'Choisir le canal', [
      { text: 'Email', onPress: () => creerRelance(niveau, 'email') },
      { text: 'SMS', onPress: () => creerRelance(niveau, 'sms') },
      { text: 'Appel', onPress: () => creerRelance(niveau, 'appel') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };
  const creerRelance = (niveau: number, canal: Relance['canal']) =>
    relancesRepo.creer({ factureId: facture.id, projetId: facture.projetId, date: new Date().toISOString(), niveau, canal }, u);

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: facture.numero }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.numero}>{facture.numero}</Text>
          <Text style={styles.sous}>
            {LIBELLE_TYPE_FACTURE[facture.type]} · Projet {projet?.reference ?? '—'} · {formaterDate(facture.date)}
          </Text>
          <Text style={styles.statut}>{LIBELLE_STATUT_FACTURE[facture.statut]}</Text>
        </View>
        <BadgeEtat etat={facture.etat} />
      </View>

      {facture.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulée</Text>
          <Text style={styles.encartTexte}>Motif : {facture.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Lignes ({lignes.length})</Text>
        {actif ? <Pressable onPress={() => { setLigneEnEdition(null); setModalLigne(true); }}><Text style={styles.ajouter}>+ Ajouter</Text></Pressable> : null}
      </View>
      <View style={styles.carte}>
        {lignes.length === 0 ? (
          <Text style={styles.videSection}>Aucune ligne.</Text>
        ) : (
          lignes.map((l) => (
            <Pressable key={l.id} style={styles.ligne} onPress={() => actif && (setLigneEnEdition(l), setModalLigne(true))} onLongPress={() => actif && supprimerLigne(l)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ligneDesignation}>{l.designation}</Text>
                <Text style={styles.ligneDetail}>{l.quantite} {l.unite} × {formaterMontant(l.prixUnitaire)}</Text>
              </View>
              <Text style={styles.ligneTotal}>{formaterMontant(l.totalLigne)}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.totaux}>
        <LigneTotal label="Total HT" valeur={facture.totalHT} />
        <LigneTotal label={`TVA (${facture.tauxTVA}%)`} valeur={facture.totalTVA} />
        <LigneTotal label="Total TTC" valeur={facture.totalTTC} fort />
        <LigneTotal label="Payé" valeur={facture.montantPaye} />
        <LigneTotal label="Reste à payer" valeur={reste} alerte={reste > 0} />
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Paiements ({paiements.length})</Text>
        {actif ? <Pressable onPress={() => setModalPaiement(true)}><Text style={styles.ajouter}>+ Encaisser</Text></Pressable> : null}
      </View>
      <View style={styles.carte}>
        {paiements.length === 0 ? (
          <Text style={styles.videSection}>Aucun paiement.</Text>
        ) : (
          paiements.map((p) => (
            <Pressable key={p.id} style={styles.ligne} onLongPress={() => actif && supprimerPaiement(p)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ligneDesignation}>{formaterMontant(p.montant)}</Text>
                <Text style={styles.ligneDetail}>{LIBELLE_MODE_PAIEMENT[p.mode]}{p.reference ? ` · ${p.reference}` : ''} · {formaterDate(p.date)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Relances ({relances.length})</Text>
        {actif ? <Pressable onPress={ajouterRelance}><Text style={styles.ajouter}>+ Relancer</Text></Pressable> : null}
      </View>
      <View style={styles.carte}>
        {relances.length === 0 ? (
          <Text style={styles.videSection}>Aucune relance.</Text>
        ) : (
          relances.map((r) => (
            <View key={r.id} style={styles.ligne}>
              <Text style={styles.ligneDesignation}>Niveau {r.niveau} · {r.canal}</Text>
              <Text style={styles.ligneDetail}>{formaterDate(r.date)}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/facturation/formulaire?id=${facture.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer cette facture en lecture seule ?', () => facturesRepo.archiver(facture.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={facture.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer cette facture (soft-delete) ?', () => facturesRepo.supprimer(facture.id, u))} />
      </View>

      <ModalLigneDevis visible={modalLigne} valeurInitiale={ligneEnEdition} onAnnuler={() => setModalLigne(false)} onConfirmer={enregistrerLigne} />
      <ModalPaiement visible={modalPaiement} resteAPayer={reste} onAnnuler={() => setModalPaiement(false)} onConfirmer={enregistrerPaiement} />
      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); facturesRepo.annuler(facture.id, motif, u).then(() => router.back()); }} />
    </ScrollView>
  );
}

function Centre({ texte }: { texte: string }) {
  return <View style={styles.centre}><Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text></View>;
}
function LigneTotal({ label, valeur, fort, alerte }: { label: string; valeur: number; fort?: boolean; alerte?: boolean }) {
  return (
    <View style={styles.ligneTotalRow}>
      <Text style={[styles.totalLabel, fort && styles.totalFort]}>{label}</Text>
      <Text style={[styles.totalValeur, fort && styles.totalFort, alerte && { color: couleurs.alerte }]}>{formaterMontant(valeur)}</Text>
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
  ajouter: { color: couleurs.primaireClair, fontWeight: '700', fontSize: 14 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.sm },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', alignItems: 'center', paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ligneDesignation: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ligneDetail: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  ligneTotal: { fontSize: 15, fontWeight: '700', color: couleurs.texte, marginLeft: espacements.sm },
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
