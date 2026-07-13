import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChampDate } from '@/components/ChampDate';
import { useCollection } from '@/hooks/useRepository';
import { devisRepo } from '@/services/devisService';
import {
  convertirDevisEnFacture,
  facturesRepo,
  LIBELLE_STATUT_FACTURE,
  LIBELLE_TYPE_FACTURE,
} from '@/services/factureService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Facture, StatutFacture, TypeFacture } from '@/types/models';

const TYPES = Object.keys(LIBELLE_TYPE_FACTURE) as TypeFacture[];
const STATUTS = Object.keys(LIBELLE_STATUT_FACTURE) as StatutFacture[];
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireFacture() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: tousDevis } = useCollection(devisRepo);

  const [projetId, setProjetId] = useState<string | null>(null);
  const [numero, setNumero] = useState('');
  const [type, setType] = useState<TypeFacture>('acompte');
  const [date, setDate] = useState(aujourdhui());
  const [echeance, setEcheance] = useState('');
  const [tauxTVA, setTauxTVA] = useState('19');
  const [statut, setStatut] = useState<StatutFacture>(StatutFacture.Brouillon);
  const [importDevisId, setImportDevisId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const devisDuProjet = useMemo(
    () => tousDevis.filter((d) => d.projetId === projetId),
    [tousDevis, projetId]
  );

  useEffect(() => {
    if (!id) return;
    facturesRepo.lire(id).then((f) => {
      if (!f) return;
      setProjetId(f.projetId);
      setNumero(f.numero);
      setType(f.type);
      setDate(f.date.slice(0, 10));
      setEcheance(f.dateEcheance ? f.dateEcheance.slice(0, 10) : '');
      setTauxTVA(String(f.tauxTVA));
      setStatut(f.statut);
    });
  }, [id]);

  const choisirImport = (devisId: string) => {
    if (importDevisId === devisId) {
      setImportDevisId(null);
      return;
    }
    setImportDevisId(devisId);
    const d = tousDevis.find((x) => x.id === devisId);
    if (d) setTauxTVA(String(d.tauxTVA));
  };

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    if (!numero.trim()) return setErreur('Le numéro est obligatoire.');
    const taux = Number(tauxTVA.replace(',', '.')) || 0;

    if (edition && id) {
      await facturesRepo.modifier(
        id,
        {
          projetId,
          numero: numero.trim(),
          type,
          date: new Date(date).toISOString(),
          dateEcheance: echeance ? new Date(echeance).toISOString() : undefined,
          tauxTVA: taux,
          statut,
        },
        u
      );
      router.back();
      return;
    }

    const data: SansMeta<Facture> = {
      projetId,
      devisId: importDevisId ?? undefined,
      numero: numero.trim(),
      type,
      date: new Date(date).toISOString(),
      dateEcheance: echeance ? new Date(echeance).toISOString() : undefined,
      statut,
      tauxTVA: taux,
      totalHT: 0,
      totalTVA: 0,
      totalTTC: 0,
      montantPaye: 0,
    };
    const cree = await facturesRepo.creer(data, u);
    if (importDevisId) {
      await convertirDevisEnFacture(importDevisId, cree.id, u);
    }
    router.replace(`/(modules)/facturation/${cree.id}`);
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier la facture' : 'Nouvelle facture' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
        {projets.length === 0 ? <Text style={styles.aide}>Aucun projet. Créez d'abord un projet.</Text> : null}
      </View>

      {!edition && projetId ? (
        <>
          <Label texte="Importer les lignes d'un devis (optionnel)" />
          <View style={styles.chips}>
            {devisDuProjet.length === 0 ? (
              <Text style={styles.aide}>Aucun devis pour ce projet.</Text>
            ) : (
              devisDuProjet.map((d) => (
                <Chip key={d.id} actif={importDevisId === d.id} label={d.numero} onPress={() => choisirImport(d.id)} />
              ))
            )}
          </View>
        </>
      ) : null}

      <Label texte="Numéro *" />
      <TextInput style={styles.champ} value={numero} onChangeText={setNumero} placeholder="FAC-2026-001" autoCapitalize="characters" />

      <Label texte="Type" />
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t} actif={type === t} label={LIBELLE_TYPE_FACTURE[t]} onPress={() => setType(t)} />
        ))}
      </View>

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampDate label="Date" value={date} onChange={setDate} />
        </View>
        <View style={styles.moitie}>
          <ChampDate label="Échéance" value={echeance} onChange={setEcheance} placeholder="—" />
        </View>
      </View>

      <Label texte="Taux de TVA (%)" />
      <TextInput style={styles.champ} value={tauxTVA} onChangeText={setTauxTVA} keyboardType="numeric" />

      <Label texte="Statut" />
      <View style={styles.chips}>
        {STATUTS.map((s) => (
          <Chip key={s} actif={statut === s} label={LIBELLE_STATUT_FACTURE[s]} onPress={() => setStatut(s)} />
        ))}
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>
          {edition ? 'Enregistrer' : importDevisId ? 'Créer depuis le devis' : 'Créer et saisir les lignes'}
        </Text>
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
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
