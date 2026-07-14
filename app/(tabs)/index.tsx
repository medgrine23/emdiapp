import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carte } from '@/components/Carte';
import { useCollection } from '@/hooks/useRepository';
import { devisRepo } from '@/services/devisService';
import { facturesRepo, resteAPayer } from '@/services/factureService';
import { entrepriseRepo } from '@/services/parametreService';
import { tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { MODULES } from '@/modules/registry';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { StatutDevis, StatutProjet } from '@/types/models';

export default function Accueil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: devis } = useCollection(devisRepo);
  const { items: factures } = useCollection(facturesRepo);
  const { items: taches } = useCollection(tachesRepo);
  const { items: entreprises } = useCollection(entrepriseRepo);
  const entreprise = entreprises[0]?.nom ?? 'MDI Build';

  const kpis = useMemo(() => {
    const maintenant = new Date().toISOString();
    return {
      projetsActifs: projets.filter((p) => p.statut === StatutProjet.EnCours).length,
      aFacturer: factures.filter((f) => resteAPayer(f) > 0).length,
      retards: taches.filter((t) => t.avancementPct < 100 && t.dateFin < maintenant).length,
      devisEnCours: devis.filter((d) => d.statut === StatutDevis.Brouillon || d.statut === StatutDevis.Envoye).length,
    };
  }, [projets, devis, factures, taches]);

  const pilotage = useMemo(
    () =>
      projets
        .filter((p) => p.statut === StatutProjet.EnCours)
        .slice(0, 4)
        .map((p) => {
          const t = taches.filter((x) => x.projetId === p.id);
          const avancement = t.length ? Math.round(t.reduce((s, x) => s + x.avancementPct, 0) / t.length) : 0;
          return { id: p.id, nom: p.nom, avancement };
        }),
    [projets, taches]
  );

  return (
    <View style={styles.conteneur}>
      <View style={[styles.entete, { paddingTop: insets.top + espacements.md }]}>
        <View style={styles.logo}>
          <Feather name="home" size={20} color={couleurs.surAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.salut}>Bonjour 👋</Text>
          <Text style={styles.entreprise}>{entreprise}</Text>
        </View>
      </View>

      <ScrollView style={styles.corps} contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <View style={styles.tiles}>
          <Tile icone="briefcase" label="Projets actifs" valeur={kpis.projetsActifs} />
          <Tile icone="file" label="À facturer" valeur={kpis.aFacturer} />
          <Tile icone="alert-triangle" label="Tâches en retard" valeur={kpis.retards} alerte={kpis.retards > 0} />
          <Tile icone="file-text" label="Devis en cours" valeur={kpis.devisEnCours} />
        </View>

        {pilotage.length > 0 ? (
          <>
            <Text style={styles.section}>Pilotage des projets</Text>
            <Carte>
              {pilotage.map((p, i) => (
                <View key={p.id} style={[styles.pilote, i > 0 && styles.piloteBorde]}>
                  <View style={styles.piloteHaut}>
                    <Text style={styles.piloteNom} numberOfLines={1}>{p.nom}</Text>
                    <Text style={styles.pilotePct}>{p.avancement}%</Text>
                  </View>
                  <View style={styles.barre}>
                    <View style={[styles.barreFill, { width: `${p.avancement}%` }]} />
                  </View>
                </View>
              ))}
            </Carte>
          </>
        ) : null}

        <Text style={styles.section}>Modules</Text>
        <View style={styles.grille}>
          {MODULES.map((m) => (
            <Carte key={m.cle} onPress={() => router.push(m.route as never)} padding={false} style={styles.mod}>
              <View style={styles.icone}>
                <Feather name={m.icone} size={22} color={couleurs.primaire} />
              </View>
              <Text style={styles.modTitre}>{m.titre}</Text>
            </Carte>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Tile({ icone, label, valeur, alerte }: { icone: React.ComponentProps<typeof Feather>['name']; label: string; valeur: number; alerte?: boolean }) {
  return (
    <Carte style={styles.tile}>
      <View style={styles.tileHaut}>
        <View style={[styles.tileIcone, alerte && { backgroundColor: `${couleurs.danger}14` }]}>
          <Feather name={icone} size={16} color={alerte ? couleurs.danger : couleurs.primaireClair} />
        </View>
        <Text style={[styles.tileValeur, alerte && valeur > 0 && { color: couleurs.danger }]}>{valeur}</Text>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Carte>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.md,
    backgroundColor: couleurs.primaire,
    paddingHorizontal: espacements.lg,
    paddingBottom: espacements.lg,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center' },
  salut: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  entreprise: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  corps: { flex: 1 },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  tile: { width: '48%', padding: espacements.md },
  tileHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileIcone: { width: 30, height: 30, borderRadius: 9, backgroundColor: `${couleurs.primaire}12`, alignItems: 'center', justifyContent: 'center' },
  tileValeur: { fontSize: 26, fontWeight: '800', color: couleurs.texte },
  tileLabel: { fontSize: 12, color: couleurs.texteSecondaire, marginTop: espacements.sm },
  section: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: couleurs.texteSecondaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  pilote: { paddingVertical: espacements.sm + 2, paddingHorizontal: espacements.md },
  piloteBorde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: couleurs.bordure },
  piloteHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  piloteNom: { fontSize: 14, fontWeight: '600', color: couleurs.texte, flex: 1, marginRight: espacements.sm },
  pilotePct: { fontSize: 13, fontWeight: '800', color: couleurs.primaireClair },
  barre: { height: 8, backgroundColor: couleurs.surface2, borderRadius: 4, overflow: 'hidden' },
  barreFill: { height: '100%', backgroundColor: couleurs.primaireClair, borderRadius: 4 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  mod: { width: '31.5%', padding: espacements.md, alignItems: 'center', gap: espacements.sm },
  icone: { width: 46, height: 46, borderRadius: 14, backgroundColor: `${couleurs.primaire}12`, alignItems: 'center', justifyContent: 'center' },
  modTitre: { fontSize: 12, fontWeight: '700', color: couleurs.texte, textAlign: 'center' },
});
