import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { useDocument } from '@/hooks/useRepository';
import { piecesRepo } from '@/services/quantitatifService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function DetailPiece() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: piece, chargement } = useDocument(piecesRepo, id);
  const { item: projet } = useDocument(projetsRepo, piece?.projetId);
  const [modalAnnul, setModalAnnul] = useState(false);

  if (chargement) return <Centre texte="Chargement…" />;
  if (!piece) return <Centre texte="Pièce introuvable." />;

  const actif = piece.etat === EtatEntite.Actif;

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: () => action().then(() => router.back()) },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: piece.nom }} />

      <View style={styles.enTete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nom}>{piece.nom}</Text>
          <Text style={styles.sous}>Projet {projet?.reference ?? '—'} · {piece.longueur} × {piece.largeur} × {piece.hauteur} m</Text>
        </View>
        <BadgeEtat etat={piece.etat} />
      </View>

      {piece.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulée</Text>
          <Text style={styles.encartTexte}>Motif : {piece.annulation.motif}</Text>
        </View>
      ) : null}

      <View style={styles.metriques}>
        <Met label="Surface au sol" valeur={`${piece.surfaceSol} m²`} />
        <Met label="Surface des murs" valeur={`${piece.surfaceMurs} m²`} />
        <Met label="Volume" valeur={`${piece.volume} m³`} />
      </View>

      <Text style={styles.sectionTitre}>Ouvertures ({piece.ouvertures.length})</Text>
      <View style={styles.carte}>
        {piece.ouvertures.length === 0 ? (
          <Text style={styles.videSection}>Aucune ouverture.</Text>
        ) : (
          piece.ouvertures.map((o, i) => (
            <View key={i} style={styles.ligne}>
              <Text style={styles.ouvNom}>{o.nom}</Text>
              <Text style={styles.ouvDim}>{o.largeur}×{o.hauteur} m × {o.quantite}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitre}>Actions</Text>
      <View style={styles.actions}>
        <Bouton label="Modifier" couleur={couleurs.primaireClair} desactive={!actif} onPress={() => router.push(`/(modules)/quantitatif/formulaire?id=${piece.id}`)} />
        <Bouton label="Archiver" couleur={couleurs.texteSecondaire} desactive={!actif} onPress={() => confirmer('Archiver', 'Passer cette pièce en lecture seule ?', () => piecesRepo.archiver(piece.id, u))} />
        <Bouton label="Annuler" couleur={couleurs.danger} desactive={!actif} onPress={() => setModalAnnul(true)} />
        <Bouton label="Supprimer" couleur={couleurs.alerte} desactive={piece.etat === EtatEntite.Supprime} onPress={() => confirmer('Supprimer', 'Supprimer cette pièce (soft-delete) ?', () => piecesRepo.supprimer(piece.id, u))} />
      </View>

      <ModalAnnulation visible={modalAnnul} onAnnuler={() => setModalAnnul(false)} onConfirmer={(motif) => { setModalAnnul(false); piecesRepo.annuler(piece.id, motif, u).then(() => router.back()); }} />
    </ScrollView>
  );
}

function Centre({ texte }: { texte: string }) {
  return <View style={styles.centre}><Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text></View>;
}
function Met({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.met}>
      <Text style={styles.metLabel}>{label}</Text>
      <Text style={styles.metValeur}>{valeur}</Text>
    </View>
  );
}
function Bouton({ label, couleur, onPress, desactive }: { label: string; couleur: string; onPress: () => void; desactive?: boolean }) {
  return (
    <Pressable style={[styles.bouton, { borderColor: couleur }, desactive && styles.boutonOff]} onPress={onPress} disabled={desactive}>
      <Text style={[styles.boutonTexte, { color: desactive ? couleurs.bordure : couleur }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond },
  enTete: { flexDirection: 'row', alignItems: 'flex-start' },
  nom: { fontSize: 22, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  encartAnnul: { backgroundColor: `${couleurs.danger}10`, borderColor: couleurs.danger, borderWidth: 1, borderRadius: rayons.sm, padding: espacements.sm, marginTop: espacements.md },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  metriques: { flexDirection: 'row', gap: espacements.sm, marginTop: espacements.md },
  met: { flex: 1, backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.md, padding: espacements.md },
  metLabel: { fontSize: 11, color: couleurs.texteSecondaire, textTransform: 'uppercase' },
  metValeur: { fontSize: 17, fontWeight: '800', color: couleurs.primaire, marginTop: 2 },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.sm },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: espacements.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ouvNom: { fontSize: 15, color: couleurs.texte, fontWeight: '600' },
  ouvDim: { fontSize: 13, color: couleurs.texteSecondaire },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: { borderWidth: 1.5, borderRadius: rayons.sm, paddingVertical: espacements.sm, paddingHorizontal: espacements.md },
  boutonOff: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
