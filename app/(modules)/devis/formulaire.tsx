import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChampDate } from '@/components/ChampDate';
import { useCollection } from '@/hooks/useRepository';
import { devisRepo, LIBELLE_STATUT_DEVIS } from '@/services/devisService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Devis, StatutDevis } from '@/types/models';

const STATUTS = Object.values(StatutDevis);
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export default function FormulaireDevis() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);

  const [projetId, setProjetId] = useState<string | null>(null);
  const [numero, setNumero] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [tauxTVA, setTauxTVA] = useState('19');
  const [statut, setStatut] = useState<StatutDevis>(StatutDevis.Brouillon);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    devisRepo.lire(id).then((d) => {
      if (!d) return;
      setProjetId(d.projetId);
      setNumero(d.numero);
      setDate(d.date.slice(0, 10));
      setTauxTVA(String(d.tauxTVA));
      setStatut(d.statut);
    });
  }, [id]);

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    if (!numero.trim()) return setErreur('Le numéro est obligatoire.');
    const taux = Number(tauxTVA.replace(',', '.')) || 0;
    const u = UTILISATEUR_COURANT_ID;

    if (edition && id) {
      await devisRepo.modifier(id, { projetId, numero: numero.trim(), date: new Date(date).toISOString(), tauxTVA: taux, statut }, u);
      router.back();
    } else {
      const data: SansMeta<Devis> = {
        projetId,
        numero: numero.trim(),
        date: new Date(date).toISOString(),
        statut,
        tauxTVA: taux,
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
      };
      const cree = await devisRepo.creer(data, u);
      // On ouvre le détail pour saisir les lignes.
      router.replace(`/(modules)/devis/${cree.id}`);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier le devis' : 'Nouveau devis' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
        {projets.length === 0 ? <Text style={styles.aide}>Aucun projet. Créez d'abord un projet.</Text> : null}
      </View>

      <Label texte="Numéro *" />
      <TextInput style={styles.champ} value={numero} onChangeText={setNumero} placeholder="DEV-2026-001" autoCapitalize="characters" />

      <ChampDate label="Date" value={date} onChange={setDate} />

      <Label texte="Taux de TVA (%)" />
      <TextInput style={styles.champ} value={tauxTVA} onChangeText={setTauxTVA} keyboardType="numeric" />

      <Label texte="Statut" />
      <View style={styles.chips}>
        {STATUTS.map((s) => (
          <Chip key={s} actif={statut === s} label={LIBELLE_STATUT_DEVIS[s]} onPress={() => setStatut(s)} />
        ))}
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer et saisir les lignes'}</Text>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
