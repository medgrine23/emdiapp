import { useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { ModalLigneAchat, SaisieLigneAchat } from '@/components/ModalLigneAchat';
import {
  aDepassement,
  bonsCommandeRepo,
  evaluerDepassement,
  fournisseursRepo,
  LIBELLE_STATUT_BON_COMMANDE,
  lignesAchatRepo,
  livraisonsRepo,
  recalculerBonCommande,
} from '@/services/achatService';
import { lignesDevisRepo } from '@/services/devisService';
import { projetsRepo } from '@/services/projetService';
import { useCollection, useDocument } from '@/hooks/useRepository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite, LigneAchat, LigneDevis, Livraison } from '@/types/models';
import { formaterDate, formaterMontant } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailBonCommande() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: bc, chargement } = useDocument(bonsCommandeRepo, id);
  const { item: projet } = useDocument(projetsRepo, bc?.projetId);
  const { item: fournisseur } = useDocument(fournisseursRepo, bc?.fournisseurId);
  const { items: lignes } = useCollection<LigneAchat>(lignesAchatRepo, { filtre: { bonCommandeId: id } });
  const { items: livraisons } = useCollection<Livraison>(livraisonsRepo, { filtre: { bonCommandeId: id } });
  const { items: lignesDevis } = useCollection<LigneDevis>(lignesDevisRepo, { filtre: { projetId: bc?.projetId } });

  const [modalLigne, setModalLigne] = useState(false);
  const [ligneEnEdition, setLigneEnEdition] = useState<LigneAchat | null>(null);
  const [modalAnnul, setModalAnnul] = useState(false);

  const refParId = useMemo(() => {
    const m = new Map<string, LigneDevis>();
    lignesDevis.forEach((l) => m.set(l.id, l));
    return m;
  }, [lignesDevis]);

  const depassements = useMemo(
    () =>
      lignes.filter((l) => l.ligneDevisId && aDepassement(evaluerDepassement(l, refParId.get(l.ligneDevisId) ?? null))).length,
    [lignes, refParId]
  );

  if (chargement) return <Centre texte="Chargement…" />;
  if (!bc) return <Centre texte="Bon de commande introuvable." />;

  const actif = bc.etat === EtatEntite.Actif;

  const enregistrerLigne = async (saisie: SaisieLigneAchat) => {
    setModalLigne(false);
    const totalLigne = saisie.quantite * saisie.prixUnitaire;
    if (ligneEnEdition) {
      await lignesAchatRepo.modifier(ligneEnEdition.id, { ...saisie, totalLigne }, u);
    } else {
      await lignesAchatRepo.creer({ ...saisie, totalLigne, bonCommandeId: bc.id, projetId: bc.projetId }, u);
    }
    await recalculerBonCommande(bc.id, u);
  };

  const supprimerLigne = (l: LigneAchat) =>
    Alert.alert('Supprimer la ligne', l.designation, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await lignesAchatRepo.supprimer(l.id, u); await recalculerBonCommande(bc.id, u); } },
    ]);

  const ajouterLivraison = () =>
    Alert.alert('Réception de livraison', 'La livraison est-elle conforme ?', [
      { text: 'Conforme', onPress: () => creerLivraison(true) },
      { text: 'Non conforme', onPress: () => creerLivraison(false) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  const creerLivraison = (conforme: boolean) =>
    livraisonsRepo.creer({ bonCommandeId: bc.id, projetId: bc.projetId, date: new Date().toISOString(), receptionnePar: u, conforme }, u);

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  const toSaisie = (l: LigneAchat): SaisieLigneAchat => ({
    designation: l.designation, unite: l.unite, quantite: l.quantite, prixUnitaire: l.prixUnitaire, ligneDevisId: l.ligneDevisId ?? null,
  });

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: bc.numero }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.numero}>{bc.numero}</Text>
          <Text style={styles.sous}>{fournisseur?.nom ?? '—'} · Projet {projet?.reference ?? '—'} · {formaterDate(bc.date)}</Text>
          <Text style={styles.statut}>{LIBELLE_STATUT_BON_COMMANDE[bc.statut]}</Text>
        </View>
        <BadgeEtat etat={bc.etat} />
      </View>

      {bc.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulé</Text>
          <Text style={styles.encartTexte}>Motif : {bc.annulation.motif}</Text>
        </View>
      ) : null}

      {depassements > 0 ? (
        <View style={styles.alerteBudget}>
          <Text style={styles.alerteBudgetTexte}>
            ⚠ Contrôle budgétaire : {depassements} ligne(s) dépassent le devis (quantité ou prix).
          </Text>
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
          lignes.map((l) => {
            const dep = l.ligneDevisId ? evaluerDepassement(l, refParId.get(l.ligneDevisId) ?? null) : null;
            const alerte = dep ? aDepassement(dep) : false;
            return (
              <Pressable key={l.id} style={styles.ligne} onPress={() => actif && (setLigneEnEdition(l), setModalLigne(true))} onLongPress={() => actif && supprimerLigne(l)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ligneDesignation}>{l.designation}{alerte ? ' ⚠' : ''}</Text>
                  <Text style={[styles.ligneDetail, alerte && { color: couleurs.danger }]}>{l.quantite} {l.unite} × {formaterMontant(l.prixUnitaire)}</Text>
                </View>
                <Text style={styles.ligneTotal}>{formaterMontant(l.totalLigne)}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.totaux}>
        <View style={styles.ligneTotalRow}>
          <Text style={styles.totalFort}>Total HT</Text>
          <Text style={styles.totalFort}>{formaterMontant(bc.totalHT)}</Text>
        </View>
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Livraisons ({livraisons.length})</Text>
        {actif ? <Pressable onPress={ajouterLivraison}><Text style={styles.ajouter}>+ Réceptionner</Text></Pressable> : null}
      </View>
      <View style={styles.carte}>
        {livraisons.length === 0 ? (
          <Text style={styles.videSection}>Aucune livraison.</Text>
        ) : (
          livraisons.map((liv) => (
            <View key={liv.id} style={styles.ligne}>
              <Text style={styles.ligneDesignation}>{formaterDate(liv.date)}</Text>
              <Text style={[styles.ligneDetail, { color: liv.conforme ? couleurs.succes : couleurs.danger }]}>
                {liv.conforme ? 'Conforme' : 'Non conforme'}
              </Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/achats/formulaire?id=${bc.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer ce bon de commande en lecture seule ?', () => bonsCommandeRepo.archiver(bc.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={bc.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer ce bon de commande (soft-delete) ?', () => bonsCommandeRepo.supprimer(bc.id, u))} />
      </View>

      <ModalLigneAchat
        visible={modalLigne}
        valeurInitiale={ligneEnEdition ? toSaisie(ligneEnEdition) : null}
        lignesDevis={lignesDevis}
        onAnnuler={() => setModalLigne(false)}
        onConfirmer={enregistrerLigne}
      />
      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); bonsCommandeRepo.annuler(bc.id, motif, u).then(() => router.back()); }} />
    </ScrollView>
  );
}

function Centre({ texte }: { texte: string }) {
  return <View style={styles.centre}><Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text></View>;
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
  alerteBudget: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  alerteBudgetTexte: { color: couleurs.danger, fontWeight: '700', fontSize: 13 },
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
  totalFort: { fontSize: 17, fontWeight: '800', color: couleurs.primaire },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
