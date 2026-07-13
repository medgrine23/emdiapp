import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { useCollection, useDocument } from '@/hooks/useRepository';
import {
  documentsRepo,
  formaterTaille,
  ICONE_TYPE_DOCUMENT,
  liaisonsRepo,
  LIBELLE_TYPE_DOCUMENT,
} from '@/services/documentService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';
import { formaterDate } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function DetailDocument() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: doc, chargement } = useDocument(documentsRepo, id);
  const { item: projet } = useDocument(projetsRepo, doc?.projetId ?? undefined);
  const { items: liaisons } = useCollection(liaisonsRepo, { filtre: { documentId: id } });
  const [modalAnnul, setModalAnnul] = useState(false);

  if (chargement) return <Centre texte="Chargement…" />;
  if (!doc) return <Centre texte="Document introuvable." />;

  const actif = doc.etat === EtatEntite.Actif;

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: doc.nom }} />

      <View style={styles.enTete}>
        <Text style={styles.icone}>{ICONE_TYPE_DOCUMENT[doc.type]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.nom}>{doc.nom}</Text>
          <Text style={styles.sous}>{LIBELLE_TYPE_DOCUMENT[doc.type]}</Text>
        </View>
        <BadgeEtat etat={doc.etat} />
      </View>

      {doc.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulé</Text>
          <Text style={styles.encartTexte}>Motif : {doc.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.carte}>
        <Champ label="Projet" valeur={projet?.reference ?? 'Global'} />
        <Champ label="Taille" valeur={formaterTaille(doc.tailleOctets)} />
        {doc.url ? <Champ label="URL" valeur={doc.url} /> : null}
        <Champ label="Ajouté le" valeur={formaterDate(doc.creeLe)} />
      </View>

      <Text style={styles.sectionTitre}>Rattachements ({liaisons.length})</Text>
      <View style={styles.carte}>
        {liaisons.length === 0 ? (
          <Text style={styles.videSection}>Document non rattaché à une entité spécifique.</Text>
        ) : (
          liaisons.map((l) => (
            <View key={l.id} style={styles.ligne}>
              <Text style={styles.ligneDesignation}>{l.entiteType}</Text>
              <Text style={styles.ligneDetail}>{l.entiteId}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/documentation/formulaire?id=${doc.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer ce document en lecture seule ?', () => documentsRepo.archiver(doc.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={doc.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer ce document (soft-delete) ?', () => documentsRepo.supprimer(doc.id, u))} />
      </View>

      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); documentsRepo.annuler(doc.id, motif, u).then(() => router.back()); }} />
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
      <Text style={styles.champValeur} numberOfLines={1}>{valeur}</Text>
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
  enTete: { flexDirection: 'row', alignItems: 'center', gap: espacements.md },
  icone: { fontSize: 36 },
  nom: { fontSize: 20, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  encartAnnul: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginTop: espacements.md },
  champ: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: espacements.md },
  champLabel: { color: couleurs.texteSecondaire, fontSize: 14 },
  champValeur: { color: couleurs.texte, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: espacements.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ligneDesignation: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ligneDetail: { fontSize: 12, color: couleurs.texteSecondaire, flexShrink: 1, marginLeft: espacements.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
