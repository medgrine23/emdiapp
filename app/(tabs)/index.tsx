import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { devisRepo } from '@/services/devisService';
import { facturesRepo, resteAPayer } from '@/services/factureService';
import { tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { MODULES } from '@/modules/registry';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { StatutDevis, StatutProjet } from '@/types/models';

export default function Accueil() {
  const { items: projets } = useCollection(projetsRepo);
  const { items: devis } = useCollection(devisRepo);
  const { items: factures } = useCollection(facturesRepo);
  const { items: taches } = useCollection(tachesRepo);

  const kpis = useMemo(() => {
    const maintenant = new Date().toISOString();
    return {
      projetsActifs: projets.filter((p) => p.statut === StatutProjet.EnCours).length,
      aFacturer: factures.filter((f) => resteAPayer(f) > 0).length,
      retards: taches.filter((t) => t.avancementPct < 100 && t.dateFin < maintenant).length,
      devisEnCours: devis.filter((d) => d.statut === StatutDevis.Brouillon || d.statut === StatutDevis.Envoye).length,
    };
  }, [projets, devis, factures, taches]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.sousTitre}>Tableau de bord</Text>

      <View style={styles.tiles}>
        <Tile label="Projets actifs" valeur={kpis.projetsActifs} />
        <Tile label="À facturer" valeur={kpis.aFacturer} />
        <Tile label="Tâches en retard" valeur={kpis.retards} alerte={kpis.retards > 0} />
        <Tile label="Devis en cours" valeur={kpis.devisEnCours} />
      </View>

      <Text style={styles.section}>Modules</Text>
      <View style={styles.grille}>
        {MODULES.map((m) => (
          <Link key={m.cle} href={m.route as never} asChild>
            <Pressable style={styles.mod}>
              <View style={styles.icone}>
                <Feather name={m.icone} size={22} color={couleurs.primaireClair} />
              </View>
              <Text style={styles.modTitre}>{m.titre}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function Tile({ label, valeur, alerte }: { label: string; valeur: number; alerte?: boolean }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValeur, alerte && { color: couleurs.danger }]}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md },
  sousTitre: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: couleurs.texteSecondaire, marginBottom: espacements.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  tile: { width: '48%', backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  tileLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: couleurs.texteSecondaire },
  tileValeur: { fontSize: 26, fontWeight: '800', color: couleurs.texte, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: couleurs.texteSecondaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  mod: { width: '31.5%', backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md, alignItems: 'center', gap: espacements.sm },
  icone: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${couleurs.primaire}14`, alignItems: 'center', justifyContent: 'center' },
  modTitre: { fontSize: 12, fontWeight: '700', color: couleurs.texte, textAlign: 'center' },
});
