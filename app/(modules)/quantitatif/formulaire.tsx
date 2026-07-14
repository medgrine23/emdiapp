import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ModalOuverture } from '@/components/ModalOuverture';
import { useCollection } from '@/hooks/useRepository';
import { projetsRepo } from '@/services/projetService';
import { calculerMetriques, piecesRepo } from '@/services/quantitatifService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { OuverturePiece, Piece } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function FormulairePiece() {
  const { id, projetId: projetParam } = useLocalSearchParams<{ id?: string; projetId?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);

  const [projetId, setProjetId] = useState<string | null>(projetParam ?? null);
  const [nom, setNom] = useState('');
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [ouvertures, setOuvertures] = useState<OuverturePiece[]>([]);
  const [modal, setModal] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    piecesRepo.lire(id).then((p) => {
      if (!p) return;
      setProjetId(p.projetId);
      setNom(p.nom);
      setLongueur(String(p.longueur));
      setLargeur(String(p.largeur));
      setHauteur(String(p.hauteur));
      setOuvertures(p.ouvertures ?? []);
    });
  }, [id]);

  const L = Number(longueur.replace(',', '.')) || 0;
  const l = Number(largeur.replace(',', '.')) || 0;
  const h = Number(hauteur.replace(',', '.')) || 0;
  const metriques = useMemo(() => calculerMetriques({ longueur: L, largeur: l, hauteur: h, ouvertures }), [L, l, h, ouvertures]);

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    if (!nom.trim()) return setErreur('Le nom de la pièce est obligatoire.');
    if (L <= 0 || l <= 0 || h <= 0) return setErreur('Renseignez longueur, largeur et hauteur.');

    const data: SansMeta<Piece> = {
      projetId,
      nom: nom.trim(),
      longueur: L,
      largeur: l,
      hauteur: h,
      ouvertures,
      ...metriques,
    };
    if (edition && id) await piecesRepo.modifier(id, data, u);
    else await piecesRepo.creer(data, u);
    router.back();
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier la pièce' : 'Nouvelle pièce' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      <Label texte="Nom de la pièce *" />
      <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Ex : Chambre 1" />

      <View style={styles.ligne}>
        <View style={styles.tiers}><Label texte="Longueur (m)" /><TextInput style={styles.champ} value={longueur} onChangeText={setLongueur} keyboardType="numeric" /></View>
        <View style={styles.tiers}><Label texte="Largeur (m)" /><TextInput style={styles.champ} value={largeur} onChangeText={setLargeur} keyboardType="numeric" /></View>
        <View style={styles.tiers}><Label texte="Hauteur (m)" /><TextInput style={styles.champ} value={hauteur} onChangeText={setHauteur} keyboardType="numeric" /></View>
      </View>

      <View style={styles.sectionEntete}>
        <Text style={styles.sectionTitre}>Ouvertures ({ouvertures.length})</Text>
        <Pressable onPress={() => setModal(true)}><Text style={styles.ajouter}>+ Ajouter</Text></Pressable>
      </View>
      <View style={styles.carte}>
        {ouvertures.length === 0 ? (
          <Text style={styles.videSection}>Aucune ouverture (porte/fenêtre).</Text>
        ) : (
          ouvertures.map((o, i) => (
            <View key={i} style={styles.ligneOuv}>
              <Text style={styles.ouvNom}>{o.nom} · {o.largeur}×{o.hauteur} m × {o.quantite}</Text>
              <Pressable onPress={() => setOuvertures((prev) => prev.filter((_, j) => j !== i))}>
                <Feather name="trash-2" size={18} color={couleurs.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.apercu}>
        <Text style={styles.apercuTitre}>Métriques calculées</Text>
        <View style={styles.apMet}>
          <ApMet label="Surface au sol" valeur={`${metriques.surfaceSol} m²`} />
          <ApMet label="Surface des murs" valeur={`${metriques.surfaceMurs} m²`} />
          <ApMet label="Volume" valeur={`${metriques.volume} m³`} />
        </View>
        <Text style={styles.apercuNote}>Surface des murs = périmètre × hauteur − ouvertures.</Text>
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer la pièce'}</Text>
      </Pressable>

      <ModalOuverture visible={modal} onAnnuler={() => setModal(false)} onConfirmer={(o) => { setOuvertures((prev) => [...prev, o]); setModal(false); }} />
    </ScrollView>
  );
}

function Label({ texte }: { texte: string }) {
  return <Text style={styles.label}>{texte}</Text>;
}
function Chip({ label, actif, onPress }: { label: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, actif && styles.chipActif]} onPress={onPress}>
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{label}</Text>
    </Pressable>
  );
}
function ApMet({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.apMetItem}>
      <Text style={styles.apMetLabel}>{label}</Text>
      <Text style={styles.apMetValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  tiers: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espacements.lg, marginBottom: espacements.sm },
  sectionTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire },
  ajouter: { color: couleurs.primaireClair, fontWeight: '700', fontSize: 14 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.sm },
  videSection: { color: couleurs.texteSecondaire, padding: espacements.sm, textAlign: 'center' },
  ligneOuv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: espacements.sm, paddingHorizontal: espacements.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: couleurs.bordure },
  ouvNom: { fontSize: 14, color: couleurs.texte, flex: 1 },
  apercu: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginTop: espacements.md },
  apercuTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: couleurs.primaire, marginBottom: espacements.sm },
  apMet: { flexDirection: 'row', gap: espacements.sm },
  apMetItem: { flex: 1, backgroundColor: couleurs.surface2, borderRadius: rayons.sm, padding: espacements.sm },
  apMetLabel: { fontSize: 11, color: couleurs.texteSecondaire },
  apMetValeur: { fontSize: 15, fontWeight: '800', color: couleurs.primaire, marginTop: 2 },
  apercuNote: { fontSize: 11, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.sm },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
