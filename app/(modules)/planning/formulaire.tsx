import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChampDate } from '@/components/ChampDate';
import { useCollection } from '@/hooks/useRepository';
import { lignesDevisRepo } from '@/services/devisService';
import { calculerDuree, LIBELLE_STATUT_TACHE, tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { StatutTache, TachePlanning } from '@/types/models';

const STATUTS = Object.keys(LIBELLE_STATUT_TACHE) as StatutTache[];
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireTache() {
  const { id, projetId: projetParam } = useLocalSearchParams<{ id?: string; projetId?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: lignesDevis } = useCollection(lignesDevisRepo);

  const [projetId, setProjetId] = useState<string | null>(projetParam ?? null);
  const [nom, setNom] = useState('');
  const [dateDebut, setDateDebut] = useState(aujourdhui());
  const [dateFin, setDateFin] = useState(aujourdhui());
  const [avancement, setAvancement] = useState('0');
  const [statut, setStatut] = useState<StatutTache>(StatutTache.APlanifier);
  const [ligneDevisId, setLigneDevisId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const lignesDuProjet = useMemo(() => lignesDevis.filter((l) => l.projetId === projetId), [lignesDevis, projetId]);

  useEffect(() => {
    if (!id) return;
    tachesRepo.lire(id).then((t) => {
      if (!t) return;
      setProjetId(t.projetId);
      setNom(t.nom);
      setDateDebut(t.dateDebut.slice(0, 10));
      setDateFin(t.dateFin.slice(0, 10));
      setAvancement(String(t.avancementPct));
      setStatut(t.statut);
      setLigneDevisId(t.ligneDevisId ?? null);
    });
  }, [id]);

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    if (!nom.trim()) return setErreur('Le nom de la tâche est obligatoire.');
    const debutISO = new Date(dateDebut).toISOString();
    const finISO = new Date(dateFin).toISOString();
    if (new Date(finISO) < new Date(debutISO)) return setErreur('La date de fin doit suivre la date de début.');
    const av = Math.max(0, Math.min(100, Number(avancement.replace(',', '.')) || 0));

    const base = {
      projetId,
      nom: nom.trim(),
      dateDebut: debutISO,
      dateFin: finISO,
      dureeJours: calculerDuree(debutISO, finISO),
      avancementPct: av,
      statut,
      ligneDevisId: ligneDevisId ?? null,
      responsableId: null,
    };

    if (edition && id) {
      await tachesRepo.modifier(id, base, u);
      router.back();
    } else {
      const taches = await tachesRepo.lister({ filtre: { projetId } });
      const data: SansMeta<TachePlanning> = { ...base, ordre: taches.length + 1 };
      await tachesRepo.creer(data, u);
      router.back();
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier la tâche' : 'Nouvelle tâche' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      <Label texte="Nom de la tâche *" />
      <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Ex : Gros œuvre — fondations" />

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampDate label="Début" value={dateDebut} onChange={setDateDebut} />
        </View>
        <View style={styles.moitie}>
          <ChampDate label="Fin" value={dateFin} onChange={setDateFin} />
        </View>
      </View>

      <Label texte="Avancement (%)" />
      <TextInput style={styles.champ} value={avancement} onChangeText={setAvancement} keyboardType="numeric" />

      <Label texte="Statut" />
      <View style={styles.chips}>
        {STATUTS.map((s) => (
          <Chip key={s} actif={statut === s} label={LIBELLE_STATUT_TACHE[s]} onPress={() => setStatut(s)} />
        ))}
      </View>

      <Label texte="Ligne de devis associée (optionnel)" />
      <View style={styles.chips}>
        {lignesDuProjet.length === 0 ? (
          <Text style={styles.aide}>Aucune ligne de devis pour ce projet.</Text>
        ) : (
          lignesDuProjet.map((l) => (
            <Chip key={l.id} actif={ligneDevisId === l.id} label={l.designation} onPress={() => setLigneDevisId(ligneDevisId === l.id ? null : l.id)} />
          ))
        )}
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer la tâche'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Label({ texte }: { texte: string }) {
  return <Text style={styles.label}>{texte}</Text>;
}
function Chip({ label, actif, onPress }: { label: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, actif && styles.chipActif]} onPress={onPress}>
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface, maxWidth: '100%' },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
