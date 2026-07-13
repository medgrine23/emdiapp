import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { useCollection } from '@/hooks/useRepository';
import { piecesRepo } from '@/services/quantitatifService';
import { projetsRepo } from '@/services/projetService';
import { couleurs, espacements, rayons } from '@/theme/theme';

export default function ListePieces() {
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: pieces } = useCollection(piecesRepo);
  const [projetId, setProjetId] = useState<string | null>(null);

  const projetActif = projetId ?? projets[0]?.id ?? null;
  const piecesProjet = useMemo(() => pieces.filter((p) => p.projetId === projetActif), [pieces, projetActif]);

  return (
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.enTete}>
          <Text style={styles.label}>Projet</Text>
          <Link href="/(modules)/quantitatif/nomenclature" asChild>
            <Pressable style={styles.lienNomen}>
              <Feather name="list" size={15} color={couleurs.primaireClair} />
              <Text style={styles.lienNomenTexte}>Nomenclature</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: espacements.sm }}>
          <View style={styles.chips}>
            {projets.map((p) => (
              <Pressable key={p.id} style={[styles.chip, projetActif === p.id && styles.chipActif]} onPress={() => setProjetId(p.id)}>
                <Text style={[styles.chipTexte, projetActif === p.id && styles.chipTexteActif]}>{p.reference}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {piecesProjet.length === 0 ? (
          <Text style={styles.vide}>Aucune pièce. Appuyez sur + pour en créer une.</Text>
        ) : (
          piecesProjet.map((p) => (
            <Link key={p.id} href={`/(modules)/quantitatif/${p.id}`} asChild>
              <Pressable style={styles.carte}>
                <View style={styles.ligneHaut}>
                  <Text style={styles.nom}>{p.nom}</Text>
                  <BadgeEtat etat={p.etat} />
                </View>
                <Text style={styles.dims}>{p.longueur} × {p.largeur} × {p.hauteur} m</Text>
                <View style={styles.metriques}>
                  <Metrique label="Sol" valeur={`${p.surfaceSol} m²`} />
                  <Metrique label="Murs" valeur={`${p.surfaceMurs} m²`} />
                  <Metrique label="Volume" valeur={`${p.volume} m³`} />
                </View>
              </Pressable>
            </Link>
          ))
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, !projetActif && styles.fabOff]}
        onPress={() => projetActif && router.push(`/(modules)/quantitatif/formulaire?projetId=${projetActif}`)}
        disabled={!projetActif}
      >
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

function Metrique({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.met}>
      <Text style={styles.metLabel}>{label}</Text>
      <Text style={styles.metValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: 90 },
  enTete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire },
  lienNomen: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lienNomenTexte: { color: couleurs.primaireClair, fontWeight: '700', fontSize: 13 },
  chips: { flexDirection: 'row', gap: espacements.xs, marginTop: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, marginBottom: espacements.sm },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  dims: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  metriques: { flexDirection: 'row', gap: espacements.sm, marginTop: espacements.sm },
  met: { flex: 1, backgroundColor: couleurs.surface2, borderRadius: rayons.sm, padding: espacements.sm },
  metLabel: { fontSize: 11, color: couleurs.texteSecondaire, textTransform: 'uppercase' },
  metValeur: { fontSize: 15, fontWeight: '700', color: couleurs.texte, marginTop: 2 },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabOff: { backgroundColor: couleurs.bordure },
});
