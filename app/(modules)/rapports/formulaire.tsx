import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ChampDate } from '@/components/ChampDate';
import { useCollection } from '@/hooks/useRepository';
import { projetsRepo } from '@/services/projetService';
import { CONDITIONS_METEO, LIBELLE_TYPE_RAPPORT, rapportsRepo } from '@/services/rapportService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Rapport, TypeRapport } from '@/types/models';

const TYPES = Object.keys(LIBELLE_TYPE_RAPPORT) as TypeRapport[];
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireRapport() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);

  const [projetId, setProjetId] = useState<string | null>(null);
  const [type, setType] = useState<TypeRapport>('journalier');
  const [date, setDate] = useState(aujourdhui());
  const [condition, setCondition] = useState<string>('Ensoleillé');
  const [temperature, setTemperature] = useState('');
  const [intemperie, setIntemperie] = useState(false);
  const [effectif, setEffectif] = useState('0');
  const [remarques, setRemarques] = useState('');
  const [avancement, setAvancement] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    rapportsRepo.lire(id).then((r) => {
      if (!r) return;
      setProjetId(r.projetId);
      setType(r.type);
      setDate(r.date.slice(0, 10));
      setCondition(r.meteo?.condition ?? 'Ensoleillé');
      setTemperature(r.meteo?.temperatureC != null ? String(r.meteo.temperatureC) : '');
      setIntemperie(r.meteo?.intemperie ?? false);
      setEffectif(String(r.effectifPresent));
      setRemarques(r.remarques ?? '');
      setAvancement(r.avancementGlobalPct != null ? String(r.avancementGlobalPct) : '');
    });
  }, [id]);

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    const base = {
      projetId,
      type,
      date: new Date(date).toISOString(),
      auteurId: u,
      meteo: {
        condition,
        temperatureC: temperature ? Number(temperature.replace(',', '.')) : undefined,
        intemperie,
      },
      effectifPresent: Number(effectif.replace(/\s/g, '')) || 0,
      remarques: remarques.trim() || undefined,
      avancementGlobalPct: avancement ? Math.max(0, Math.min(100, Number(avancement.replace(',', '.')))) : undefined,
      photoIds: [] as string[],
    };

    if (edition && id) {
      await rapportsRepo.modifier(id, base, u);
      router.back();
    } else {
      const cree = await rapportsRepo.creer(base as SansMeta<Rapport>, u);
      router.replace(`/(modules)/rapports/${cree.id}`);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier le rapport' : 'Nouveau rapport' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      <Label texte="Type" />
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t} actif={type === t} label={LIBELLE_TYPE_RAPPORT[t]} onPress={() => setType(t)} />
        ))}
      </View>

      <ChampDate label="Date" value={date} onChange={setDate} />

      <Label texte="Météo" />
      <View style={styles.chips}>
        {CONDITIONS_METEO.map((c) => (
          <Chip key={c} actif={condition === c} label={c} onPress={() => setCondition(c)} />
        ))}
      </View>

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <Label texte="Température (°C)" />
          <TextInput style={styles.champ} value={temperature} onChangeText={setTemperature} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={[styles.moitie, styles.switchBox]}>
          <Text style={styles.switchLabel}>Intempérie</Text>
          <Switch value={intemperie} onValueChange={setIntemperie} />
        </View>
      </View>

      <Label texte="Effectif présent" />
      <TextInput style={styles.champ} value={effectif} onChangeText={setEffectif} keyboardType="numeric" />

      <Label texte="Avancement global (%)" />
      <TextInput style={styles.champ} value={avancement} onChangeText={setAvancement} keyboardType="numeric" placeholder="Optionnel" />

      <Label texte="Remarques" />
      <TextInput style={[styles.champ, styles.multi]} value={remarques} onChangeText={setRemarques} multiline placeholder="Observations du jour…" />

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer et saisir l\'avancement'}</Text>
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
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  multi: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  switchBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: espacements.md + 2 },
  switchLabel: { fontSize: 14, color: couleurs.texte, fontWeight: '600' },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
