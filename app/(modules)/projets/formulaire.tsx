import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { clientsRepo, LIBELLE_STATUT_PROJET, projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { SansMeta } from '@/services/repository';
import { Projet, StatutProjet } from '@/types/models';

const STATUTS = Object.values(StatutProjet);

export default function FormulaireProjet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: clients } = useCollection(clientsRepo);

  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [statut, setStatut] = useState<StatutProjet>(StatutProjet.Brouillon);
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    projetsRepo.lire(id).then((p) => {
      if (!p) return;
      setNom(p.nom);
      setReference(p.reference);
      setDescription(p.description ?? '');
      setClientId(p.clientId);
      setBudget(String(p.budgetAlloue));
      setStatut(p.statut);
      setAdresse(p.localisation.adresse);
      setVille(p.localisation.ville ?? '');
      setCodePostal(p.localisation.codePostal ?? '');
    });
  }, [id]);

  const enregistrer = async () => {
    if (!nom.trim() || !reference.trim()) return setErreur('Nom et référence sont obligatoires.');
    if (!clientId) return setErreur('Sélectionnez un client.');
    const budgetNum = Number(budget.replace(/\s/g, '')) || 0;

    const data: SansMeta<Projet> = {
      nom: nom.trim(),
      reference: reference.trim(),
      description: description.trim() || undefined,
      clientId,
      budgetAlloue: budgetNum,
      statut,
      localisation: {
        adresse: adresse.trim(),
        ville: ville.trim() || undefined,
        codePostal: codePostal.trim() || undefined,
      },
    };

    const u = UTILISATEUR_COURANT_ID;
    if (edition && id) {
      await projetsRepo.modifier(id, data, u);
    } else {
      await projetsRepo.creer(data, u);
    }
    router.back();
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier le projet' : 'Nouveau projet' }} />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Nom *" />
      <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Nom du chantier" />

      <Label texte="Référence *" />
      <TextInput style={styles.champ} value={reference} onChangeText={setReference} placeholder="CH-2026-003" autoCapitalize="characters" />

      <Label texte="Description" />
      <TextInput
        style={[styles.champ, styles.multi]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description du projet"
        multiline
      />

      <Label texte="Client *" />
      <View style={styles.chips}>
        {clients.map((c) => (
          <Chip key={c.id} actif={clientId === c.id} label={c.nom} onPress={() => setClientId(c.id)} />
        ))}
        {clients.length === 0 ? <Text style={styles.aide}>Aucun client (à créer via le module Paramètres).</Text> : null}
      </View>

      <Label texte="Budget alloué (DZD)" />
      <TextInput style={styles.champ} value={budget} onChangeText={setBudget} placeholder="0" keyboardType="numeric" />

      <Label texte="Statut" />
      <View style={styles.chips}>
        {STATUTS.map((s) => (
          <Chip key={s} actif={statut === s} label={LIBELLE_STATUT_PROJET[s]} onPress={() => setStatut(s)} />
        ))}
      </View>

      <Label texte="Adresse" />
      <TextInput style={styles.champ} value={adresse} onChangeText={setAdresse} placeholder="Adresse" />

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <Label texte="Ville" />
          <TextInput style={styles.champ} value={ville} onChangeText={setVille} placeholder="Ville" />
        </View>
        <View style={styles.moitie}>
          <Label texte="Code postal" />
          <TextInput style={styles.champ} value={codePostal} onChangeText={setCodePostal} placeholder="06000" keyboardType="numeric" />
        </View>
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer le projet'}</Text>
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
  erreur: {
    color: couleurs.danger,
    backgroundColor: `${couleurs.danger}10`,
    padding: espacements.sm,
    borderRadius: rayons.sm,
    marginBottom: espacements.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: couleurs.texteSecondaire,
    marginTop: espacements.md,
    marginBottom: espacements.xs,
  },
  champ: {
    backgroundColor: couleurs.surface,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.sm,
    padding: espacements.sm,
    color: couleurs.texte,
    fontSize: 15,
  },
  multi: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.lg,
    paddingHorizontal: espacements.md,
    paddingVertical: 6,
    backgroundColor: couleurs.surface,
  },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  valider: {
    backgroundColor: couleurs.accent,
    borderRadius: rayons.md,
    padding: espacements.md,
    alignItems: 'center',
    marginTop: espacements.lg,
  },
  validerTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
