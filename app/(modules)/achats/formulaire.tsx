import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { bonsCommandeRepo, fournisseursRepo, LIBELLE_STATUT_BON_COMMANDE } from '@/services/achatService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { useCollection } from '@/hooks/useRepository';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { BonCommande, StatutBonCommande } from '@/types/models';

const STATUTS = Object.keys(LIBELLE_STATUT_BON_COMMANDE) as StatutBonCommande[];
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireBonCommande() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: fournisseurs } = useCollection(fournisseursRepo);

  const [projetId, setProjetId] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
  const [numero, setNumero] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [statut, setStatut] = useState<StatutBonCommande>(StatutBonCommande.Brouillon);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    bonsCommandeRepo.lire(id).then((b) => {
      if (!b) return;
      setProjetId(b.projetId);
      setFournisseurId(b.fournisseurId);
      setNumero(b.numero);
      setDate(b.date.slice(0, 10));
      setStatut(b.statut);
    });
  }, [id]);

  const enregistrer = async () => {
    if (!projetId) return setErreur('Sélectionnez un projet.');
    if (!fournisseurId) return setErreur('Sélectionnez un fournisseur.');
    if (!numero.trim()) return setErreur('Le numéro est obligatoire.');

    if (edition && id) {
      await bonsCommandeRepo.modifier(id, { projetId, fournisseurId, numero: numero.trim(), date: new Date(date).toISOString(), statut }, u);
      router.back();
      return;
    }
    const data: SansMeta<BonCommande> = {
      projetId,
      fournisseurId,
      numero: numero.trim(),
      date: new Date(date).toISOString(),
      statut,
      totalHT: 0,
    };
    const cree = await bonsCommandeRepo.creer(data, u);
    router.replace(`/(modules)/achats/${cree.id}`);
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier le bon de commande' : 'Nouveau bon de commande' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Projet *" />
      <View style={styles.chips}>
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
        {projets.length === 0 ? <Text style={styles.aide}>Aucun projet. Créez d'abord un projet.</Text> : null}
      </View>

      <Label texte="Fournisseur *" />
      <View style={styles.chips}>
        {fournisseurs.map((f) => (
          <Chip key={f.id} actif={fournisseurId === f.id} label={f.nom} onPress={() => setFournisseurId(f.id)} />
        ))}
        {fournisseurs.length === 0 ? <Text style={styles.aide}>Aucun fournisseur (à créer via Paramètres).</Text> : null}
      </View>

      <Label texte="Numéro *" />
      <TextInput style={styles.champ} value={numero} onChangeText={setNumero} placeholder="BC-2026-001" autoCapitalize="characters" />

      <Label texte="Date (AAAA-MM-JJ)" />
      <TextInput style={styles.champ} value={date} onChangeText={setDate} />

      <Label texte="Statut" />
      <View style={styles.chips}>
        {STATUTS.map((s) => (
          <Chip key={s} actif={statut === s} label={LIBELLE_STATUT_BON_COMMANDE[s]} onPress={() => setStatut(s)} />
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
  validerTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
